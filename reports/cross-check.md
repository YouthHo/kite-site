# Stage 2 · 跨文件一致性校验报告

- 日期: 2026-08-12

## 冲突数：27

| 文件A | 文件B | 冲突 | 值A | 值B |
| --- | --- | --- | --- | --- |
| scenes.json:23 | characters.json:7 | 名场面集数超出相关角色出场区间 | ep=30 | 陆汉卿 episodes=[2,15] |
| relationships.json:34 | characters.json | activeEra 超出两端出场交集 | [20,34] | 交集=[18,26] |
| relationships.json:36 | characters.json | activeEra 超出两端出场交集 | [1,30] | 交集=[6,46] |
| relationships.json:38 | characters.json | activeEra 超出两端出场交集 | [6,26] | 交集=[1,14] |
| relationships.json:39 | characters.json | activeEra 超出两端出场交集 | [1,2] | 交集=[1,1] |
| relationships.json:42 | characters.json | activeEra 超出两端出场交集 | [1,39] | 交集=[2,22] |
| relationships.json:43 | characters.json | activeEra 超出两端出场交集 | [1,39] | 交集=[3,34] |
| relationships.json:51 | characters.json | activeEra 超出两端出场交集 | [33,46] | 交集=[14,22] |
| relationships.json:54 | characters.json | activeEra 超出两端出场交集 | [1,22] | 交集=[1,13] |
| relationships.json:55 | characters.json | activeEra 超出两端出场交集 | [22,46] | 交集=[4,22] |
| relationships.json:56 | characters.json | activeEra 超出两端出场交集 | [1,6] | 交集=[16,46] |
| relationships.json:62 | characters.json | activeEra 超出两端出场交集 | [6,46] | 交集=[6,13] |
| relationships.json:63 | characters.json | activeEra 超出两端出场交集 | [22,46] | 交集=[13,13] |
| relationships.json:65 | characters.json | activeEra 超出两端出场交集 | [1,22] | 交集=[6,13] |
| relationships.json:67 | characters.json | activeEra 超出两端出场交集 | [20,34] | 交集=[18,22] |
| relationships.json:68 | characters.json | activeEra 超出两端出场交集 | [1,4] | 交集=[4,4] |
| relationships.json:69 | characters.json | activeEra 超出两端出场交集 | [1,4] | 交集=[2,4] |
| relationships.json:70 | characters.json | activeEra 超出两端出场交集 | [6,26] | 交集=[1,4] |
| relationships.json:71 | characters.json | activeEra 超出两端出场交集 | [20,34] | 交集=[8,22] |
| relationships.json:83 | characters.json | activeEra 超出两端出场交集 | [22,46] | 交集=[4,22] |
| relationships.json:84 | characters.json | activeEra 超出两端出场交集 | [1,22] | 交集=[3,13] |
| relationships.json:87 | characters.json | activeEra 超出两端出场交集 | [1,6] | 交集=[4,1] |
| relationships.json:89 | characters.json | activeEra 超出两端出场交集 | [1,6] | 交集=[2,1] |
| relationships.json:98 | characters.json | activeEra 超出两端出场交集 | [22,46] | 交集=[4,13] |
| relationships.json:99 | characters.json | activeEra 超出两端出场交集 | [22,46] | 交集=[16,22] |
| architecture.json | characters.json | 架构成员 person 不在角色表 | j3 | j3 |
| architecture.json | characters.json | 架构成员 person 不在角色表 | c9 | c9 |