# Issue: 动作抢占风暴、进程重启与 Embedding 通道不可用

**日期:** 2026-07-02  
**状态:** Open  
**优先级:** P0（抢占/重启） / P2（embedding）  
**日志来源:** `Windows PowerShell.txt`（当日测试）

---

## 摘要

在建筑任务测试中出现大量 `trying to interrupt current action` 与 `waiting for code to finish executing...`，多次触发 `Agent process exited with code 1` → `Restarting agent...`。同时 Gateway 的 embedding 模型 `text-embedding-3-small` 不可用，系统降级为 `word-overlap`。

主对话（`claude-sonnet-4-6` via gateway）正常；受影响的是动作执行稳定性与示例/技能检索质量。

---

## 问题 A：动作抢占与进程重启

### 现象

- 高频日志：`action "..." trying to interrupt current action "..."`
- 连续数十行：`waiting for code to finish executing...`
- 返回：`Previous action interrupted.`
- 偶发：`Code execution triggered catch: PathStopped: Path was stopped before it could be completed!`
- 多次：`Agent Aki/Haru disconnected` → `Agent process exited with code 1` → `Restarting agent...`
- 至少 6 次：`(AUTO MESSAGE)Your previous action '...' was interrupted by unstuck.`
- 同名动作自抢占：`action:goToSharedPlace` interrupt `action:goToSharedPlace`；`action:smeltItem` interrupt `action:smeltItem`

### 根因分析

#### 1. 单动作槽 + 无条件抢占（设计）

`ActionManager` 同一时刻只允许一个 `executing`。任何新 `runAction` 都会先 `stop()` 当前动作：

- `requestInterrupt()` 设置 `interrupt_code` 并 `pathfinder.stop()`
- 每 300ms 轮询直到旧动作结束
- **10 秒**仍停不下来 → `cleanKill()` → `process.exit(1)` → `AgentProcess` 自动 `Restarting agent...`

相关代码：`src/agent/action_manager.js`、`src/agent/agent.js`（`requestInterrupt`）

#### 2. 三类抢占源互相打架

| 来源 | 触发 | 标签示例 |
|------|------|----------|
| LLM 命令 | `!goToSharedPlace` 等 | `action:...` |
| 自动 Mode | 每 300ms `modes.update()` | `mode:unstuck`, `mode:item_collecting` |
| 系统消息 | unstuck 后 AUTO MESSAGE → 再下命令 | 间接抢占 |

`unstuck` / `cowardice` / `self_defense` 的 `interrupts: ['all']` 可打断**任何**玩家命令。卡住约 20s 即触发 unstuck。

相关代码：`src/agent/modes.js`

#### 3. `handleMessage` 并发（架构缺陷，主因之一）

以下路径调用 `handleMessage` **未 await**，可导致多条消息处理并行、各自下发 `!command`：

- 公屏/私聊：`src/agent/agent.js` → `respondFunc`
- Bot 私聊：`src/agent/conversation.js` → `_handleFullInMessage`
- Mode 打断后：`src/agent/modes.js` → `execute()` 内 AUTO MESSAGE

→ 解释日志中「同一命令自己打断自己」。

#### 4. `unstuck` 正反馈环

1. 寻路/采集卡住 20s → `mode:unstuck` 抢占  
2. 结束后注入 AUTO MESSAGE → LLM 再发 `!goTo*`  
3. 仍卡住 → 再 unstuck → 循环  

#### 5. LLM 命令连发

`max_commands = -1`（无限制），一轮可连续执行多个 `!command`，加剧抢占。

#### 6. `PathStopped` 被当作异常

interrupt 时 `pathfinder.stop()` 抛出 `PathStopped`。`goToPosition` 会 catch，但 `goToGoal` 会 rethrow，上层可能进入 `action_manager` catch，LLM 误判失败后立刻再发移动命令。

#### 7. 部分技能中断响应慢

- `craftRecipe`：几乎无 `interrupt_code` 检查，`bot.craft()` 可能长时间阻塞 `stop()`
- `smeltItem`：1 秒轮询一次 `interrupt_code`
- `pickupNearbyItems`：循环内无 `interrupt_code` 检查

#### 8. `!smeltItem` 成功会主动重启（设计行为）

熔炼成功后 500ms 调用 `cleanKill('Safely restarting to update inventory.')`，与频繁 smelt 叠加会放大「总在重启」的感受。

相关代码：`src/agent/commands/actions.js`

---

## 问题 B：Embedding 通道不可用

### 现象（每次 agent 重启后重复出现）

```
Embedding probe failed (gateway/text-embedding-3-small): 503 No available channel for model text-embedding-3-small under group ...
Embedding probe failed (gateway (default)): 503 No available channel ...
Embedding probe failed (chat model): 500 not implemented
No embedding API available; using word-overlap for example selection.
```

### 当前配置

Profile 中 embedding 指向：

- `api: gateway`
- `model: text-embedding-3-small`
- `api_key: GATEWAY_API_KEY` / `GATEWAY2_API_KEY`（按 bot 分 key）

解析路径：`src/models/prompter.js` → `_resolveEmbeddingModel()`  
候选顺序：profile embedding → chat 同源 gateway → chat model embed → 降级 word-overlap

### 影响

| 模块 | embedding 正常 | 降级后 |
|------|----------------|--------|
| 主对话 LLM | 不受影响 | 不受影响 |
| `Examples` 示例选择 | 语义相似度 | `word-overlap`，相关性下降 |
| `SkillLibrary` 技能文档检索 | 向量检索 | 降级后检索质量明显下降 |
| `!newAction` 代码生成 | 较好 | 可能选错技能文档 |

**结论：** 不阻断运行，但会降低 prompt 示例与技能匹配的准确性。

---

## 建议修复清单

### P0 — 先止血

- [ ] `handleMessage` 串行化（消息队列或 processing 锁）
- [ ] 所有 `handleMessage` 调用改为 `await`
- [ ] `max_commands` 设为 `1` 或 `2`
- [ ] 同 action 去重（已在跑的 `action:goToSharedPlace` 忽略重复命令）
- [ ] `PathStopped` 视为正常中断，不进入 exception 路径

### P1 — 稳定抢占策略

- [ ] 建筑任务期间暂停或延长 `unstuck`（如 45–60s）
- [ ] unstuck 后减少/取消 AUTO MESSAGE 自动再下命令
- [ ] `craftRecipe` / `smeltItem` / `pickupNearbyItems` 加强 `interrupt_code` 响应
- [ ] 评估 `!smeltItem` 成功后 `cleanKill` 是否改为 idle 刷新或手动 `!restart`

### P1.5 — 提示词（可并行）

- [ ] 上一个 `!command` 未完成前不要发第二个同类命令
- [ ] 收到 `Previous action interrupted` 时先说明原因，勿立刻重复同一命令

### P2 — 观测与 Embedding

- [ ] 开启 `log_all_prompts` 便于复现
- [ ] `stop()` / `cleanKill()` 增加明确 console 原因日志
- [ ] 修复 gateway embedding 通道，或 profile 改用可用 embedding API
- [ ] 修复 `SkillLibrary` word-overlap 降级路径（若 embedding 失败时候选集过少）

---

## 验证标准

修复后日志应明显减少：

- 同名 `trying to interrupt current action`
- `waiting for code to finish executing...` 连续超过 ~10 行
- `Agent process exited with code 1` + `Restarting agent...`
- `(AUTO MESSAGE)... interrupted by unstuck` 连环出现

可保留的正常行为：

- 玩家 `!stop` 后的 `Previous action interrupted.`
- 真正卡住时偶发 1–2 次 unstuck

---

## 相关文件

- `src/agent/action_manager.js`
- `src/agent/agent.js`
- `src/agent/modes.js`
- `src/agent/conversation.js`
- `src/agent/commands/actions.js`
- `src/agent/library/skills.js`
- `src/models/prompter.js`
- `src/models/gateway.js`
- `profiles/*_gateway.json`（embedding 配置）
- `src/process/agent_process.js`（自动重启）

---

## 备注

- 日志中 `Agent X disconnected` 来自 MindServer socket 断开（进程退出后的结果），不一定是 Minecraft 踢人。
- `cleanKill` 的文案默认写入 history，不一定出现在 console，排查时需结合分支/提交或加日志。
- Vision `gl` 绑定缺失为独立问题（`Vision disabled`），与本次抢占问题无关。
