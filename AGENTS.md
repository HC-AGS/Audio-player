# 音频标记打点工具 - 需求拆解文档

## 产品概述

- **产品类型**: 音频工具 / 标记打点工具
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 需要对音频进行分段标记、反复精听/跟读练习的用户（语言学习、听写、音频剪辑标注等）
- **核心价值**: 纯前端单文件工具，支持音频打点标记与区间复读，数据本地持久化，离线可用
- **界面语言**: 中文
- **主题偏好**: 深色（用户明确要求深色主题）
- **导航模式**: 无导航（单页工具）
- **导航布局**: 无

---

## 页面结构总览

**页面文件**: `AudioMarkerPage.html`（单文件 HTML，零外部依赖）

| 区域 | 说明 |
|-----|------|
| 顶部控制栏 | 标题、文件选择、导入/导出按钮 |
| 音频播放器区 | 播放/暂停按钮、进度条、当前时间/总时长、音量调节、倍速显示 |
| 标记操作区 | 添加标记按钮、搜索框、清空全部按钮 |
| 标记列表区 | 标记条目列表（时间 + 名称 + 删除按钮），按时间排序，支持实时搜索筛选 |
| 复读控制面板 | 起始标记选择、结束标记选择、复读次数设置、倍速设置、复读间隔设置、开始/停止复读按钮、当前复读次数显示 |

---

## 页面布局建议

- **布局模式**: 上下分区（垂直流式布局）—— 工具类单页，功能模块自上而下依次排列，符合用户从"加载音频 → 播放打点 → 列表管理 → 复读练习"的操作流
- **视觉重心**: 音频播放器 + 标记列表 —— 播放器是操作核心，标记列表是数据核心，复读面板作为增强功能置于底部
- **结果承载区**: 标记列表区；初始态为"暂无标记，请先加载音频并打点"空状态提示；复读面板初始态为禁用，有标记且选择起止后启用

---

## 数据来源声明

| 数据/操作 | 来源类型 | 实现要求 | mock 兜底 |
|---|---|---|---|
| 音频文件加载 | real-file | `<input type="file">` + `URL.createObjectURL` 加载本地音频，支持 mp3/wav/m4a 等浏览器原生格式 | 无（初始无音频，提示用户选择文件） |
| 标记数据持久化 | local-persist | `localStorage` key=`__audio_marker_marks`，存储标记数组（含 time 和 name），页面加载时自动读取恢复 | 无 |
| 标记导出 JSON | import-export | `Blob` + `URL.createObjectURL` + `<a>.click()` 触发下载，文件名含时间戳 | 无 |
| 标记导入 JSON | real-file + import-export | `<input type="file">` 读取 JSON 文件，`FileReader` 解析后合并/覆盖标记列表 | 无 |
| 标记搜索筛选 | 前端计算 | 输入框 `input` 事件实时过滤标记名称，支持中文模糊匹配 | 无 |
| 复读状态 | 前端状态 | 内存中管理复读状态（当前次数、起止时间、定时器等），不持久化 | 无 |

> 类型选择依据：用户明确要求"本地选择音频文件""localStorage 保存""导出/导入 JSON"，均为真实文件操作与本地持久化需求，非 mock 展示。

---

## 功能列表

- **页面**: 音频标记打点工具（单页）
  - **页面目标**: 提供完整的音频打点标记与区间复读功能，纯前端离线可用
  - **功能点**:

    1. **本地音频加载与播放控制**
       - 触发: 顶部"选择音频文件"按钮
       - 交互: 弹出系统文件选择器，选择后通过 `URL.createObjectURL` 加载到 `<audio>` 元素
       - 提交: 设置 audio.src，显示文件名，重置进度和标记关联
       - 反馈: 播放器区域显示文件名、总时长，播放按钮可用
       - 数据契约: audio 元素状态（currentTime、duration、paused、volume、playbackRate）

    2. **播放/暂停/进度/音量控制**
       - 触发: 播放按钮、暂停按钮、进度条拖拽/点击、音量滑块
       - 交互: 点击播放/暂停切换状态；进度条 click/drag 跳转进度；音量滑块调节 0-1
       - 提交: 调用 audio.play() / audio.pause() / 设置 audio.currentTime / audio.volume
       - 反馈: 按钮图标切换、进度条实时更新、时间显示更新
       - 数据契约: audio 播放状态与进度

    3. **添加标记（含快捷键 Alt+M）**
       - 触发: "添加标记"按钮 或 快捷键 Alt+M（输入框聚焦时不触发）
       - 交互: 记录当前播放时间，弹出输入框（或行内编辑）让用户输入标记名称，默认名称如"标记 00:01:23"
       - 提交: 将 `{ id, time, name }` 加入标记数组，按 time 排序，写入 localStorage
       - 反馈: 标记列表立即更新，toast 或短暂提示"已添加标记"
       - 数据契约: `IMark { id: string; time: number; name: string }`

    4. **标记列表管理（跳转/删除/清空/搜索）**
       - 触发: 点击标记时间 → 跳转播放；点击删除图标 → 删除单个；点击"清空全部" → 清空；搜索框输入 → 实时筛选
       - 交互: 点击时间设置 audio.currentTime 并自动播放；删除前确认（单条可直接删，清空需确认）；搜索框 input 事件过滤 name
       - 提交: 更新标记数组，同步 localStorage
       - 反馈: 列表实时更新，音频跳转到对应位置开始播放
       - 数据契约: `IMark[]` + searchKeyword

    5. **标记导入/导出 JSON**
       - 触发: "导出"按钮 / "导入"按钮
       - 交互: 导出 → 生成 JSON Blob 触发下载；导入 → 选择 JSON 文件，解析后确认合并或覆盖
       - 提交: 导出时序列化标记数组；导入时解析并更新标记数组 + localStorage
       - 反馈: 导出成功提示；导入后列表刷新
       - 数据契约: JSON 格式 `{ marks: IMark[] }` 或直接 `IMark[]`

    6. **区间复读功能**
       - 触发: 选择起始标记、结束标记，设置复读次数/倍速/间隔，点击"开始复读"
       - 交互: 跳转到起始标记位置开始播放；监听 timeupdate，到达结束标记时间时暂停 → 等待间隔秒数 → 跳回起始 → 继续，直到达到次数或无限循环；显示"第 N 次复读"
       - 提交: 设置 audio.playbackRate、管理复读状态机、使用 setTimeout 控制间隔
       - 反馈: 复读状态指示、当前次数显示、开始/停止按钮状态切换
       - 数据契约: 复读状态 `{ active, startMarkId, endMarkId, count, total, interval, speed }`

    7. **快捷键支持**
       - 触发: 键盘事件
       - 交互: 空格键 → 播放/暂停（输入框/textarea 聚焦时不触发）；Alt+M → 在当前位置添加标记
       - 提交: 调用对应功能函数
       - 反馈: 与按钮操作一致的视觉反馈
       - 数据契约: document keydown 事件

---

## 数据共享配置

单页应用，无跨页面数据共享需求。所有状态在单文件内管理。

```ts
// 标记数据结构（供 Code Agent 参考）
interface IMark {
  /** 唯一标识 */
  id: string;
  /** 时间点（秒） */
  time: number;
  /** 标记名称（支持中文） */
  name: string;
}

// 复读状态结构
interface IRepeatState {
  /** 是否正在复读 */
  active: boolean;
  /** 起始标记 ID */
  startMarkId: string | null;
  /** 结束标记 ID */
  endMarkId: string | null;
  /** 当前复读次数 */
  currentCount: number;
  /** 总次数（0 表示无限） */
  totalCount: number;
  /** 播放倍速 */
  playbackRate: number;
  /** 复读间隔（秒） */
  interval: number;
}
```

---

## 技术实现约束

- **单文件 HTML**: 所有 HTML / CSS / JavaScript 写在同一个 `.html` 文件中，不引用任何外部 CDN、字体、图片资源
- **零外部依赖**: 仅使用浏览器原生 API（HTMLAudioElement、localStorage、File API、Blob、URL.createObjectURL）
- **深色主题**: 背景深色（如 #1a1a2e 或 #121212），文字浅色，强调色用蓝色/紫色系，符合现代深色 UI 规范
- **响应式**: 使用 Flexbox / Grid 布局，移动端单列堆叠，桌面端可适当两列（标记列表 + 复读面板并排）
- **离线可用**: 不依赖网络，所有功能本地完成

-------

<scene_type>prototype-app</scene_type>

# UI 设计指南

## 1. 设计推导依据

- **参考意图**: Free —— 无参考材料，从产品语义与使用场景自主建立视觉方向
- **核心情绪 / 应用类型**: 深色工具型音频打点器，专注、精准、低干扰，适合长时间精听与标注工作
- **独特记忆点**: 进度条上的标记点以发光青点呈现，当前播放位置扫过标记时产生微亮脉冲，强化"时间刻度"的精密感

## 2. Art Direction

- **方向名**: 精密音频控制台
- **Design Style**: Minimal Dark + Terminal 终端感 —— 深色基底降低视觉疲劳，等宽数字增强时间读数的精准感，契合音频标注的专业工具属性
- **DNA 参数**: 圆角 subtle (rounded-md) / 阴影 subtle (shadow-sm) / 间距 compact (gap-2 / p-4) / 字体方向: 正文无衬线 + 时间数字等宽 / 装饰手法: 细线分隔、发光标记点、微渐变进度条
- **应用类型**: Tool —— 单页纵向堆叠，播放器置顶，标记列表为主区，复读控制折叠于底部

## 3. Color System

**色彩关系**: 深空灰基底 + 青蓝主色 + 琥珀强调色，冷调为主、暖调点缀，形成专业音频控制台的视觉层次
**配色设计理由**: 深灰背景减少长时间使用的眼睛疲劳；青蓝主色承载播放、激活等正向操作；琥珀色用于复读状态提示，与主色形成冷暖对比但保持低饱和；文本与边框均控制在中高明度，确保深色下可读性
**主色推导**: 从音频波形、声波可视化的青蓝科技感出发，选择低饱和 cyan-blue 作为 primary，既区别于通用 SaaS 蓝，又契合声音/频率的语义联想
**使用比例**: 65% 深中性 / 25% 辅助灰阶 / 10% 主色与强调色；primary 仅用于播放按钮、当前进度、激活标记、CTA；accent 承担 hover、选中底、骨架屏

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|---|---|---|---|---|
| bg | `--background` | `bg-background` | hsl(220 8% 8%) | 页面最深背景，接近纯黑但带冷调 |
| card | `--card` | `bg-card` | hsl(220 7% 12%) | 播放器、列表、控制面板承载面 |
| text | `--foreground` | `text-foreground` | hsl(210 15% 92%) | 标题与正文，高对比 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(215 10% 60%) | 辅助说明、时间戳次要信息 |
| primary | `--primary` | `bg-primary` / `text-primary` | hsl(190 85% 55%) | 青蓝主色，播放、进度、激活标记 |
| primaryForeground | `--primary-foreground` | `text-primary-foreground` | hsl(220 20% 10%) | 主色上的深色文字，高对比 |
| accent | `--accent` | `bg-accent` | hsl(220 6% 18%) | hover/focus 浅底、选中底 |
| accentForeground | `--accent-foreground` | `text-accent-foreground` | hsl(210 15% 85%) | accent 上的文字 |
| border | `--border` | `border-border` | hsl(220 5% 20%) | 输入框、卡片、列表项边界 |

**语义色提示**: 成功 hsl(160 60% 45%) 三态 bg/border/text 同色系明度阶梯；警告 hsl(35 80% 55%) 用于复读进行中状态；错误 hsl(0 65% 55%) 用于导入失败等；所有语义色饱和度控制在 55-80%，与 primary 色温对齐，避免刺眼跳脱

## 4. 字体与节奏

- **font-display**: Space Grotesk —— 略带几何机械感，用于标题与时间数字，强化精密工具气质
- **font-body**: Inter + Noto Sans SC —— 清晰中性，长时阅读不疲劳，支持中文标记名
- **字号**: H1 text-xl；H2 text-lg；body text-sm；时间戳等宽 text-sm / text-xs。
- **圆角**: 小 (rounded-md) —— 工具感克制，按钮与卡片统一 6px 圆角

## 5. 全局布局契约

- **Reference Layout Use**: 按需求结构推导
- **Page / Section Order**: 顶部标题栏 → 文件选择与播放控制 → 进度条与时间 → 搜索与标记操作栏 → 标记列表 → 复读控制面板
- **Standard Content Zone**: Tool max-w-3xl + `mx-auto`，窄屏全宽，宽屏居中避免过宽
- **Shell / Frame Alignment**: 内容区与视口同宽居中，单页无侧栏
- **Padding & Rhythm**: `px-4 md:px-6 py-6 md:py-8`，区块间距 `gap-4 md:gap-6`
- **Full-bleed Zones**: 无全宽装饰；所有内容受 Standard Content Zone 约束
- **Local Narrowing**: 复读控制面板可在容器内全宽展示，标记列表项保持紧凑
- **Overflow Strategy**: 标记列表超长时 `overflow-y-auto` 固定高度；横向无溢出
- **Flexibility Boundary**: 允许移动端按钮尺寸、列表密度微调；主色、圆角、阴影、字体系统保持一致

## 6. 视觉与动效

- **装饰**: 发光标记点、细线分隔、进度条微渐变
- **阴影/边界**: 轻 —— 卡片用 1px border + 极淡内阴影，避免厚重感
- **动效**: 克制 —— 按钮 hover 底色过渡 150ms；进度条实时更新无缓动；标记添加时有轻微缩放脉冲；复读状态切换有 200ms 淡入

## 7. 组件原则

- 按钮、输入、下拉、列表项必须有 Default / Hover / Active / Focus-visible / Disabled 状态
- Primary 按钮用于播放、添加标记、开始复读等主行动；Outline/Ghost 用于次级操作（删除、清空、导入导出）
- 进度条是核心交互区，支持点击跳转、悬停显示时间、标记点可视化
- 标记列表项：左时间戳（等宽）+ 中名称 + 右删除按钮，hover 显示 accent 底
- 空状态与加载状态延续深色终端感，用 muted 文字 + 细线框，不使用插画

## 8. Image Direction

- **Image Role**: 无强制图片需求，优先通过排版、发光标记点和进度条视觉建立记忆点
- **Image Art Direction**: 无强制图片需求
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 避免通用音乐插图、耳机/声波素材图、无意义霓虹渐变背景

## 9. Anti-patterns

- **Split personality**: 播放器、列表、复读面板各自用不同圆角或阴影；全站统一 subtle 圆角与轻阴影
- **Phantom tokens**: 编造不存在的 CSS 变量；只使用已定义的 9 个基础 token + 语义色
- **Default SaaS drift**: 回到默认亮蓝按钮、紫色渐变；用青蓝主色 + 深空灰基底的音频控制台语义塑造
- **Invisible interaction**: 只做 hover 不做 focus-visible；所有可交互元素必须有清晰的键盘聚焦环
- **Mono-hue tyranny**: 主色同时用于按钮、tab、icon、边框、链接；primary 仅用于 CTA 与当前状态，其余用 accent / 中性色
- **Status color drift**: 警告/错误色饱和度过高刺眼；语义色饱和度与 primary 对齐在 ±15% 内