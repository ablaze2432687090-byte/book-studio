/* Original interface copy only. Never use this dictionary to translate artwork. */
(function(root){
 const entries = `
不同明度的中性灰为主，不加入明显色相|Use neutral gray values without a distinct hue
不新增任何文案或页码，保留作品中已有文字|Add no copy or page numbers; preserve existing artwork text
不新增文字，现有作品内部文字保持不变|Add no text; keep existing artwork text unchanged
严格对齐的模块网格、无衬线字体与清晰信息层级|Use an aligned modular grid, sans-serif type, and clear hierarchy
个人化的编辑节奏与低干扰手作痕迹，呈现独立刊物气质|Use personal editorial rhythm and subtle handmade details
中文宋体的书刊气质，注意中英文字体协调|Use Chinese Song serifs with coordinated Latin typography
主题分章节，区分章节开场与内容页，形成阅读推进|Organize chapters with distinct opening and content pages
书法感用于少量标题，正文使用清晰易读字体|Reserve calligraphy for a few headings; keep body text readable
产品设计、结构细节、材质与工艺展示|Present product design, construction, materials, and craftsmanship
仅新增画册名称与页码，不编造其他文案|Add only the book title and page numbers; invent no copy
从选定配色中选择低干扰素色，保持平整无纹理|Use an unobtrusive solid color from the selected palette
以事件、人物或时间线推进阅读，诚实呈现原始内容|Build an honest narrative around events, people, or chronology
以字体的尺度、方向和节奏形成视觉结构，保留文字可读性|Structure the page with type scale, direction, and rhythm; retain readability
以摄影作品为核心，体现拍摄主题与视觉叙事|Center photography and its visual narrative
以满版图像为主，不出现意外空边，保护主体与中缝|Favor full-bleed images; avoid accidental margins and protect subjects at the gutter
以结构、图表和数据关系组织页面；不编造缺失数据|Organize through diagrams and data relationships; never invent missing data
以自然曲线、生物形态与流动结构组织版面|Use natural curves, organic forms, and flowing structures
以蓝与橙作为互补重点色，控制用量并保持主次|Use complementary blue and orange with controlled emphasis
以蓝色的明度和饱和度变化建立层级|Build hierarchy with variations in blue value and saturation
低对比混凝土纹理，适合空间或工业主题|Use low-contrast concrete texture for spatial or industrial themes
低干扰深灰背景铺满页面|Fill pages with an unobtrusive dark gray background
低饱和淡粉、淡蓝与柔和浅色，避免荧光色|Use muted pinks, blues, and light pastels; avoid neon
作品之间保持有意的空间，留白服从构图而不是随机空缺|Use intentional spacing that serves composition, not arbitrary gaps
作品居于主位，清晰编号和低干扰说明，像艺术展览图录|Prioritize artwork with clear numbering and unobtrusive catalog captions
使用与主题相关的手绘线条和插画辅助叙述，不替换核心作品|Support the theme with relevant drawings without replacing core artwork
使用主题摄影延伸到页面边缘，保护重要主体与文字|Extend photography to the page edges while protecting subjects and text
使用日文，保留准确的品牌与项目名称|Use Japanese and preserve exact brand and project names
使用明确几何区块组织背景与信息，保持对齐秩序|Organize backgrounds and information into aligned geometric blocks
使用简体中文与英文双语，控制翻译长度与层级|Use Simplified Chinese and English with controlled lengths and hierarchy
使用简体中文，专有名称保持准确|Use Simplified Chinese with accurate proper names
使用繁体中文，专有名称保持准确|Use Traditional Chinese with accurate proper names
使用英文，保留准确的品牌与项目名称|Use English and preserve exact brand and project names
使用韩文，保留准确的品牌与项目名称|Use Korean and preserve exact brand and project names
依据素材添加准确简短标题与注释，未知信息留空|Add concise factual captions from the material; leave unknown details blank
克制的东方构图与现代排字，避免符号化堆砌传统元素|Combine restrained Eastern composition with modern type; avoid decorative cliches
克制的品牌标识、细腻材质和精确比例，避免堆叠装饰|Use restrained branding, fine materials, and precise proportions
克制的手写或手作字形作为局部强调，不牺牲正文阅读|Use handmade lettering sparingly; preserve body-text readability
克制的细颗粒背景，保持小字与作品清晰|Use subtle fine grain; keep small type and artwork clear
公司、服务能力与真实案例介绍|Present the company, services, and real case studies
具有几何结构的展示字体用于标题，避免正文过度装饰|Use geometric display type for headings, not decorative body text
具有栏目、大小标题和图文层级的编辑式排版，疏密有节奏|Use editorial sections, heading scales, and rhythmic image-text density
单面图片 + ZIP + 静态 PDF（工具支持时）|Page images + ZIP + static PDF, where supported
单面图片 + 跨页预览 + 文件命名清单（工具支持时）|Page images + spread previews + filename list, where supported
友好而清晰的图形与叙事结构，适当活泼但不过度拥挤|Use friendly graphics and clear storytelling without crowding
只保留必要标题，主体由图片表达，不堆叠长文|Keep essential headings; let images lead instead of long copy
可填写自己的要求，切回预设不会清除已填写内容。|Enter custom requirements. Returning to a preset keeps your custom text.
在整体图与细节图之间切换尺度，避免同构页面连续重复|Alternate wide views and details; avoid repetitive page structures
墨色浓淡、虚实与空间节奏，核心摄影和作品内容仍需保留|Use ink values and spatial rhythm while preserving core photography and artwork
套色、网点和轻微印刷纹理，带有老式出版物气质|Use print separations, halftones, and subtle vintage print texture
婚礼、家庭或个人重要时刻的纪念画册|Create a keepsake for weddings, families, or personal milestones
将有联系的图片组织为对照组，网格清楚，避免密集挤压|Group related images for comparison with clear grids and breathing room
展示品牌概念、视觉识别与应用案例的设计作品集|Show brand concepts, identity systems, and applications
建筑、室内或展览空间项目展示，关注空间关系与细节|Present architecture, interiors, or exhibitions with spatial relationships and details
强烈的摄影主体与大胆裁切、标题尺度，突出系列气质|Use strong photography, bold crops, and heading scale to express the collection
按作品名称、时间、材料等已知信息组织说明；缺失信息不编造|Use known titles, dates, and materials in captions; do not invent missing facts
数字界面语汇、锐利网格与局部霓虹，避免无意义装饰|Use digital visual language, sharp grids, and selective neon
旅行经历、城市观察与人文记录|Present travel experiences, urban observations, and human stories
明确主色与辅助色，使用高辨识度色块而不形成杂乱彩虹|Define primary and supporting colors; use distinct blocks without clutter
暖白背景与细腻轻微纸纹，不干扰图文|Use warm white with subtle paper texture that does not obscure content
有秩序的对称、阶梯几何与精细线条，形成复古装饰艺术气质|Use ordered symmetry, stepped geometry, and fine Art Deco linework
有逻辑地组合照片、纸片与文字层次，不破坏主体与品牌信息|Layer photos, paper, and text logically while preserving subjects and branding
服装或配饰系列展示，体现搭配、质感与系列连续性|Show fashion or accessories with styling, texture, and collection continuity
根据已知时间线安排内容，不编造时间信息|Follow the known chronology; do not invent dates
棕褐、砂岩、米色和陶土色，自然温暖|Use warm brown, sandstone, beige, and terracotta
每面设置一个清晰视觉重点，避免分散与杂乱|Give each page one clear visual focus
深森林绿与米白，少量暖灰辅助|Use deep forest green and cream with a little warm gray
深海军蓝与白，保持清晰专业的对比|Use navy and white for clear professional contrast
深空尺度、星际意象与理性科技排字，保留主体清晰度|Use deep-space scale and technical typography while keeping subjects clear
深色基底，紫色与青色霓虹作为局部强调|Use a dark base with selective purple and cyan neon
深酒红、奶油白与少量暖灰|Use burgundy, cream, and a little warm gray
清洁纯白背景，以清晰排版组织空间|Use clean white with clear spatial organization
点阵或数码字体用于重点标题，确保字形与内容准确|Use dot-matrix or digital type for key headings; keep glyphs and text accurate
现代无衬线字体，清晰、干净并保持阅读性|Use clean, readable modern sans-serif type
理性的尺寸关系、图版编号与细节对照，尊重空间摄影|Use rational proportions, plate numbering, and detail comparisons
用基本几何形、功能主义排版与有逻辑的色块关系组织画面|Use basic geometry, functional type, and logical color blocks
科技产品、未来概念或研究提案的视觉展示|Present technology, future concepts, or research proposals
稳定的视觉系统、分区明确的信息与案例结构，严谨可信|Use a consistent visual system with clear sections and credible case studies
窄体用于重点标题，正文仍使用易读字体|Use condensed type for headings and readable type for body text
等宽技术排字，清晰编号与数据标签|Use technical monospace type, clear numbers, and data labels
简洁的形体与克制的信息量，明确主次，以适量留白建立秩序|Use simple forms, restrained information, and purposeful whitespace
粗粝而直接的版式、醒目字体与非对称结构，仍保证阅读性|Use raw direct layouts, bold type, and readable asymmetry
纯黑背景铺满页面，不出现意外白边|Fill pages with black; avoid unintended white edges
细腻低对比亚麻或纤维纹理，不覆盖作品细节|Use fine low-contrast linen or fiber texture without obscuring details
细致自然观察、标本式编排和清晰注记，不编造物种信息|Use specimen layouts and accurate notes; never invent species data
细致衬线字体，适合标题和艺术图录，正文保持易读|Use refined serifs for headings and art catalogs; keep body text readable
统一方向与色系的柔和渐变，避免夸张光晕|Use soft gradients with consistent direction and colors; avoid exaggerated glows
自然稀疏星空延伸至四周边缘，避免重复星点和意外留白|Extend a sparse natural starfield to all edges; avoid repeated stars and gaps
自然风景、植物、动物与生态主题观察|Present landscapes, plants, animals, and ecological observations
艺术作品与展览图录，尊重作品本身与展陈信息|Create an art catalog that respects artwork and exhibition facts
衬线标题搭配无衬线正文，明确区分层级|Pair serif headings with sans-serif body text and clear hierarchy
象牙白、石墨灰与少量黑色，温润克制|Use restrained ivory, graphite, and a little black
逐页制作方案 + 可编辑内容（工具支持时）|Page-by-page production plan + editable content, where supported
陶土红、沙色与深棕，具有干燥自然质感|Use terracotta, sand, and dark brown for a dry natural feel
音乐专辑、演出、文化活动或独立企划展示|Present albums, performances, cultural events, or independent projects
食物、餐饮品牌、菜单理念或饮食文化专题|Present food, hospitality branding, menus, or culinary culture
黑与白为主色，保持强烈明暗关系|Use black and white with strong tonal contrast
黑底、银灰与冷白，突出冷静金属气质|Use black, silver gray, and cool white for a calm metallic feel
黑底与荧光绿色重点色，少量灰白辅助文字|Use black with neon green accents and restrained gray-white text
黑底搭配克制的香槟金与暖白，不使用过量金色|Use black with restrained champagne gold and warm white
自动与克制|Automatic & restrained
编辑与结构|Editorial & structured
品牌与艺术|Brand & art
复古与手作|Vintage & handmade
科技与自然|Technology & nature
文化与叙事|Culture & narrative
← 返回画册|← Back to book
← 返回展厅|← Back to gallery
单页展示|Single-page view
横屏观看效果更佳|Best viewed in landscape
进入展厅 →|Enter gallery →
每件作品停留时间|Time per artwork
仅导览当前展区|Tour current section only
循环|Loop
查看整墙|View entire wall
适合当前作品|Fit current artwork
2 面 · 仅封面封底|2 pages · covers only
PDF 文档|PDF document
一面一个重点|One focus per page
不加卡纸|No mat
不新增任何文案|Do not add text
东方当代|Contemporary Eastern
个人摄影集|Photography portfolio
中心对齐|Center aligned
中性灰阶|Neutral grayscale
中文宋体|Chinese Song serif
中英双语|Chinese & English
书法标题|Calligraphic headings
亚麻 / 纤维|Linen / fiber
产品 / 工艺展示|Product / craftsmanship
仅画册名称与页码|Book title and page numbers only
从参考图提取|Extract from references
企业 / 服务介绍|Company / services
企业年鉴|Corporate annual
优雅衬线|Elegant serif
低饱和粉彩|Muted pastels
作品档案式说明|Archival captions
保留原图语言|Keep original language
保留参考图字体|Keep reference typography
保留已有文案|Preserve existing copy
信息可视化|Information design
全部分类|All folders
再生纸 · 纤维杂点|Recycled paper · fiber flecks
几何分区|Geometric sections
几何展示体|Geometric plinths
制作方案 + 可编辑内容|Production plan + editable content
剪贴拼贴|Cut-paper collage
包豪斯几何|Bauhaus geometry
午夜蓝|Midnight blue
单色蓝阶|Monochrome blue
单面图片 + ZIP + PDF|Page images + ZIP + PDF
单面图片 + 命名清单|Page images + filename list
单面图片 + 跨页预览|Page images + spread previews
压纹纸 · 竖纹|Embossed paper · vertical grain
压纹纸 · 细格|Embossed paper · fine grid
压纹纸 · 锤纹|Embossed paper · hammered
原比例 · 保留尺寸差异|Original proportions · varied sizes
品牌设计作品集|Brand design portfolio
哑光炭黑|Matte charcoal
均衡阅读节奏|Balanced reading rhythm
复古印刷|Vintage print
复古点阵|Retro dot matrix
多图对照|Image comparisons
多彩色块|Color blocking
大地暖色|Warm earth tones
太空科幻|Space / science fiction
奢雅精品|Refined luxury
婚礼 / 家庭纪念|Wedding / family memories
实验字体|Experimental typography
少文字，图像为主|Image-led, minimal text
底部对齐|Bottom aligned
建筑 / 空间项目|Architecture / interiors
建筑档案|Architectural archive
总览图片|Overview images
手写 / 手作|Handwritten / handmade
手绘插画|Hand-drawn illustration
批量尺寸…|Batch size…
批量画框…|Batch frames…
按时间推进|Chronological sequence
摄影满版|Full-bleed photography
旅行 / 城市记录|Travel / city journal
无新增文字|No new text
日文|Japanese
时尚大片|Fashion editorial
时装 / 配饰 Lookbook|Fashion / accessories lookbook
暖木艺术空间|Warm wood art space
暖白影棚|Warm white studio
暖白艺术纸|Warm white art paper
暖色工作室|Warm studio
暗场摄影展|Dark photography gallery
暗色星空|Dark starfield
有机仿生|Organic / biomorphic
杂志编辑|Magazine editorial
极简主义|Minimalism
柔和渐变|Soft gradients
棉质艺术纸 · 柔软细纤维|Cotton art paper · soft fibers
森林绿|Forest green
森林绿 / 米白|Forest green / cream
植物标本|Botanical specimens
每件 12 秒|12 seconds per artwork
每件 3 秒|3 seconds per artwork
每件 5 秒|5 seconds per artwork
每件 8 秒|8 seconds per artwork
水墨意境|Ink-wash atmosphere
浅色木桌|Light wood desk
海军蓝 / 白|Navy / white
深灰满版|Full-bleed dark gray
深色木桌|Dark wood desk
深色石材|Dark stone
混凝土纹理|Concrete texture
满版沉浸|Full-bleed immersion
炭黑卡纸|Charcoal mat
牛皮纸 · 暖棕纤维|Kraft paper · warm brown fibers
独立 Zine|Independent zine
现代无衬线|Modern sans serif
现代金属展厅|Modern metal gallery
珠光纸 · 银白微闪|Pearlescent paper · silver shimmer
瑞士网格|Swiss grid
画廊图录|Gallery catalog
疏朗留白|Generous whitespace
白盒美术馆|White-cube gallery
皮革 · 不规则皮纹|Leather · irregular grain
皮革桌垫|Leather desk mat
石墨灰|Graphite gray
科技 / 概念提案|Technology / concept proposal
章节叙事|Chapter-based narrative
童趣绘本|Playful picture book
等宽 · 统一视觉宽度|Equal width
等宽技术体|Technical monospace
等高 · 统一视觉高度|Equal height
简短标题与注释|Short titles and captions
粗野主义|Brutalism
素色无纹理|Solid, untextured
紧凑窄体|Condensed type
紫 / 青霓虹|Purple / cyan neon
繁体中文|Traditional Chinese
纪实叙事|Documentary narrative
纯白背景|Pure white background
纯黑满版|Full-bleed black
细节与全景交替|Alternate details and wide views
细颗粒胶片|Fine film grain
绒面 · 低光泽|Suede · low sheen
自动判断素材主题|Infer theme from images
自定义 · 手动填写|Custom · enter manually
自然 / 生态观察|Nature / ecology
艺术 / 展览图录|Art / exhibition catalog
英文|English
蓝橙互补|Complementary blue / orange
衬线 / 无衬线搭配|Serif / sans pairing
装饰艺术 Art Deco|Art Deco
请选择…|Choose…
象牙白 / 石墨|Ivory / graphite
象牙白卡纸|Ivory mat
赛博科技|Cyber technology
跟随参考图|Follow references
跟随参考图风格|Follow reference style
酒红 / 奶油|Burgundy / cream
铜版纸 · 柔亮光泽|Coated paper · soft gloss
镭射纸 · 彩虹反光|Holographic paper · rainbow reflections
陶土 / 沙色|Terracotta / sand
韩文|Korean
音乐 / 文化企划|Music / cultural project
顶部对齐|Top aligned
餐饮 / 食物专题|Food / hospitality
高光相纸 · 镜面反光|Gloss photo paper · mirror reflections
黑底冷银|Black / cool silver
黑底荧光绿|Black / neon green
黑底香槟金|Black / champagne gold
黑白高对比|High-contrast black / white
简体中文|Simplified Chinese
JPG / PNG / WEBP · 最大 25MB|JPG / PNG / WEBP · max 25 MB
不适用|Not applicable
冷色展厅|Cool gallery
右窗光|Right window light
左窗光|Left window light
暖色台灯|Warm desk lamp
移除|Remove
聚光灯|Spotlight
轮廓光|Rim light
顶部柔光|Soft overhead light
电脑|Desktop
手机|Phone
平板|Tablet
设备|Device
竖屏|Portrait
横屏|Landscape
实际预览|Live preview
设备类型|Device type
设备预览画面|Device preview
关闭设备预览|Close device preview
可操作的画册预览|Interactive book preview
可翻页、缩放；按尺寸预览，不代替真实设备浏览器测试。|Turn pages and zoom. This size simulation does not replace testing on real devices.
返回上一界面|Back to previous view
正在读取画册…|Loading book…
无法读取这本画册，请关闭后重试|Could not load this book. Close and try again.
画册中还没有可预览的页面|This book has no pages to preview
项目恢复点|Project recovery points
创建当前恢复点|Create recovery point
自动保留最近 30 个恢复点，同一批连续调整约 5 分钟归档一次。恢复前仍会保留当前版本；不替代完整备份。|Keep up to 30 recovery points, approximately every five minutes during continuous edits. Restoring preserves the current version. These do not replace full backups.
还没有恢复点。第一次保存修改时会保留修改前的版本，也可手动创建。|No recovery points yet. The first saved edit preserves the previous version; you can also create one manually.
恢复此版本|Restore this version
先打开并保存一个项目后，再查看恢复点。|Open and save a project before viewing recovery points.
当前操作尚未完成，请先处理后再打开。|Finish the current operation before opening this panel.
正在读取…|Loading…
返回|Back
重命名项目|Rename project
项目名称|Project name
正在检查素材引用…|Checking media references…
整理未引用图片|Organize unused images
撤销最近一次整理|Undo last cleanup
部分项目无法校验，已停用整理。请先检查数据或恢复备份。|Some projects could not be validated. Cleanup is disabled. Check your data or restore a backup first.
自动恢复点|Automatic recovery point
手动恢复点|Manual recovery point
恢复前自动保留|Before restore
移入回收站前|Before trash
重命名前|Before rename
修改前|Before edit
关闭项目管理|Close project management
修改尚未保存|Changes not saved
继续编辑|Keep editing
重试保存并返回|Retry save & return
已自动保存的内容不会因“不保存并返回”而撤销。|Returning without saving does not undo previously autosaved changes.
画册加载失败|Could not load book
请检查网络后重试|Check the connection and try again
画册组件初始化失败，请重新加载|Could not initialize the book. Please reload.
已全部加载|All pages loaded
操作失败|Action failed
从素材图库添加|Add from asset library
导入独立副本，后续整理图库不会影响这个展厅。|Import independent copies. Organizing the library will not affect this gallery.
添加到当前展厅|Add to gallery
界面语言|Interface language
EXHIBITION / 展厅项目|EXHIBITION / GALLERY PROJECT
JPG / PNG / WEBP / GIF · 最大 25MB|JPG / PNG / WEBP / GIF · max 25 MB
← 返回画册项目|← Back to books
上一页|Previous page
下一页|Next page
主体与作品细节|Subjects and artwork details
主体裁断|Cropped subjects
书本效果图|Book mockups
人物特征|Personal features
优先保留原图已有文字，不编造项目事实|Preserve existing text; do not invent project facts
优先保留参考图现有字体语言，统一层级与排字|Preserve reference typography and unify hierarchy
作品尺寸规则|Artwork sizing rule
作品总览|Overview
保留原图文字与语言，不擅自翻译|Preserve original text and language; do not translate
保留原图比例，支持多种排布。|Preserve image proportions across multiple arrangements.
全册视觉系统统一，疏密与大小有变化，保持适当阅读节奏|Keep a consistent visual system with varied density and scale
全选作品|Select all artwork
删除所选|Remove selected
原图阅读顺序|Original reading order
原有配色|Original colors
原页面内部构图|Original page composition
品牌 / 项目名称|Brand / project names
品牌标志|Brand marks
图片 + 文件命名清单|Images + filename list
对齐方式|Alignment
导览设置 ▾|Tour options ▾
已有文字|Existing text
开始导览|Start tour
恢复点|Recovery points
意外白边|Unintended white margins
所有展厅更改已保存|All gallery changes saved
排版拥挤|Crowded layout
提取参考图的视觉语言，统一全册，不额外施加无关风格|Unify the reference visual language; avoid unrelated styles
显示|Show
普通内页|Inner page
根据参考图片判断主题与用途，不编造项目事实|Infer purpose from references without inventing facts
添加作品后，展墙会自动延长。|The wall extends automatically as artwork is added.
照明方式|Lighting mode
由参考图片提取统一配色，避免新增不协调颜色|Use a consistent palette drawn from the references
背景与参考图风格一致，整册保持统一|Keep backgrounds consistent with the references
装裱卡纸|Matting
视图 ▾|View ▾
让每一件作品，拥有自己的位置。|Give every artwork its own space.
设备预览 ↗|Device preview ↗
过度装饰|Excessive decoration
返回类型选择|Back to project types
重复页面|Duplicate pages
错字 / 编造事实|Typos / invented facts
隐藏|Hide
风格跳变|Inconsistent styles
照片翻页册|Photo book
正在准备画册|Preparing book
重新加载|Reload
打开的跨页|Open spread
互动照片翻页册|Interactive photo book
画册控制|Book controls
拖动、轻扫、点击页角，或使用方向键|Drag, swipe, click a corner, or use arrow keys
画册观看控制|Reading controls
缩小画册|Zoom out
放大画册|Zoom in
缩小|Zoom out
放大|Zoom in
画册缩放比例|Book zoom
适应屏幕|Fit to screen
进入全屏|Enter fullscreen
退出全屏|Exit fullscreen
合上画册|Close book
正在预载后续页面|Preloading remaining pages
作品展厅|Gallery
拖动或滚轮浏览 · 点击作品查看细节|Drag or scroll to browse · click artwork for details
上一件|Previous artwork
下一件|Next artwork
展墙位置|Wall position
起点|Start
未分区|Unsectioned
浏览作品，点击查看完整细节。|Browse artworks and click for full details.
添加作品后，可在这里快速定位。|Add artwork to navigate from this overview.
暂停导览|Pause tour
展区|Section
作者|Artist
年份|Year
尺寸|Dimensions
搜索作品 / 作者 / 展区|Search artwork / artist / section
搜索作品、作者、展区|Search artwork, artist, or section
整墙适应|Fit entire wall
恢复 100%|Reset to 100%
导览速度|Tour speed
循环导览|Loop tour
只导览当前展区|Tour current section only
展区简介，可选|Section description (optional)
展区名称|Section name
展区简介|Section description
作品目录 PDF|Artwork catalog PDF
使用指南 PDF|User guide PDF
完整离线互动展示包|Complete offline presentation
整墙总览图片 ZIP|Wall overview images ZIP
分展区总览图片 ZIP|Section overview images ZIP
正常 · 全部分类|Active · all folders
全部展区|All sections
返回编辑|Back to editor
语言切换立即生效，不会翻译作品内容。|Applies immediately. Your project content is not translated.
设置|Settings
关闭设置|Close settings
设置分类|Settings categories
常规与显示|General & appearance
数据与备份|Data & backups
AI 接入 · 可选|AI connection · optional
使用说明|User guide
关于与更新|About & updates
让工作台适合你的习惯|Make the studio your own
黑红视觉保持统一；这些偏好只影响工具界面，不会改变作品或客户展示包。|These preferences affect the workspace only, not your work or customer exports.
启动时打开|Start in
决定每次启动客户端进入的项目类型。|Choose the project collection shown on startup.
界面密度|Interface density
舒适模式留出更多空间，紧凑模式适合小尺寸屏幕。|Comfortable adds breathing room; compact suits smaller screens.
舒适|Comfortable
紧凑|Compact
界面缩放|Interface zoom
仅调整客户端文字与控件，不改变画册比例。|Resize interface text and controls, not the book proportions.
100% · 默认|100% · default
减少界面动效|Reduce motion
减少工具界面的过渡与悬停动效，作品自身的翻页配置保持不变。|Reduce workspace transitions and hover effects without changing page-turn settings.
退出前确认|Confirm before quitting
退出时先处理未完成保存，再确认是否关闭整个客户端。|Finish pending saves, then confirm before closing the application.
项目和图库采用独立数据结构。调整界面偏好，不会修改任何已导入图片或画册材质。|Projects and assets are stored separately. Interface preferences never alter images or book materials.
作品留在你自己的电脑|Your work stays on your computer
程序与数据分开保存。升级程序不会覆盖作品；备份不包含 API 密钥。|Application files and project data are separate. Updates preserve your work; backups exclude API keys.
画册项目|Books
展厅项目|Galleries
图库素材|Assets
仓库体积|Storage used
读取本机数据目录…|Reading data location…
打开数据文件夹|Open data folder
打开导出文件夹|Open exports folder
自动备份|Automatic backups
启动时检查，每隔至少 24 小时创建一份完整作品快照。|Checked on startup; complete snapshots are at least 24 hours apart.
备份保留份数|Backups to keep
保留最近的完整 ZIP 备份，旧仓库恢复副本不会被自动清理。|Keep the most recent ZIP backups. Pre-import recovery copies are never automatically removed.
3 份|3 copies
7 份 · 默认|7 copies · default
14 份|14 copies
30 份|30 copies
立即备份|Back up now
查看备份|View backups
导入或恢复会切换整个工作台仓库。操作前会校验文件并保留当前仓库；来源文件不会被修改。请不要在程序运行时手动移动数据。|Import and restore replace the active workspace after validation, preserving the previous workspace. Source files stay unchanged. Do not move data while the app is running.
导入已有仓库|Import workspace
从备份恢复|Restore backup
AI 接入，按需启用|AI, only when you need it
不配置也可以编辑、导出，或复制生成指令到外部 AI。保存设置不会调用生成接口或产生生成费用。|Edit, export, or copy prompts without connecting an API. Saving settings does not generate images or incur generation charges.
正在读取连接设置…|Reading connection settings…
服务类型|Provider
OpenAI 官方接口|OpenAI API
兼容接口 / 本地服务|Compatible API / local service
图片模型|Image model
接口地址|API base URL
留空保留已有密钥；密钥不会回显|Leave blank to keep the saved key; it is never displayed
输入能力|Input support
参考图片 + 文字|Reference images + text
仅文字|Text only
输出尺寸|Output size
1024 × 1536 · 竖向|1024 × 1536 · portrait
1536 × 1024 · 横向|1536 × 1024 · landscape
1024 × 1024 · 方形|1024 × 1024 · square
输出质量|Output quality
标准|Standard
高|High
轻量|Lightweight
自动|Automatic
移除已保存密钥|Remove saved key
保存接入设置|Save connection
Windows 密钥由当前系统用户加密保护；不会写进画册、导出包或 GitHub。更换接口地址时需要重新填写对应密钥。|Windows encrypts keys for your current OS account. Keys are excluded from projects and exports. Enter a new key when changing providers.
保存并测试连接|Save & test connection
只读取服务模型列表，不生成图片|Read the model list only; no image generation
已保存密钥 · 不回显 · 由当前 Windows 用户加密保护|Key saved · hidden · encrypted for this Windows account
未配置密钥 · 手动编辑和导出不受影响|No key configured · manual editing and exports remain available
AI 接入设置已保存；未发起生成请求|AI settings saved; no generation request was made
正在读取模型列表，不生成图片…|Reading models; no image generation…
请检查接口地址和模型名称|Check the API address and model name
从创作到交付|From creation to delivery
一套工作台，多种独立展示。无需先打开 Codex 或浏览器。|One workspace, independent presentation formats. No browser or coding assistant required.
01　创建项目|01  Create a project
画册适合翻页阅读，展厅适合横向策展。新建时选择类型，两类作品分别保存。|Books offer page-turn reading; galleries offer a horizontal exhibition. Choose a type when creating a project; collections stay separate.
02　整理素材|02  Organize assets
图库支持分类、标签、搜索和回收站。向展厅导入的是独立副本，整理图库不会破坏已导入的展厅作品。|Use folders, tags, search, and trash. Galleries import independent copies, so library changes do not break existing artwork.
03　编辑与预览|03  Edit & preview
画册支持构图裁剪、材质、灯光及设备预览；展厅支持横向拖动浏览。待保存操作完成后再退出。|Crop, apply materials and lighting, and preview books on devices. Drag to browse galleries. Wait for saves before quitting.
04　交付作品|04  Deliver your work
导出 PDF 或完整离线展示 ZIP。请将 ZIP 整体转发，接收方完整解压后再打开，不能只发送其中一个 HTML 文件。|Export a PDF or a complete offline ZIP. Send the whole ZIP; recipients must extract it fully before opening. Do not send an HTML file alone.
打开设置|Open settings
返回项目中心|Back to projects
关闭弹窗 / 详情|Close dialog / details
客户端全屏|Application fullscreen
恢复客户端界面缩放|Reset interface zoom
每次导出都是独立成品。修改作品后重新导出即可，已经交付的文件不会自动改变。|Each export is a standalone snapshot. Export again after editing; previously delivered files never change automatically.
独立的作品创作与展示工作台|An independent studio for creating and presenting work
当前版本|Version
画册 · 展厅 · 公共素材图库|Books · galleries · shared assets
更新方式|Updates
未连接公开更新源，不会静默下载或替换程序。|No public update feed is configured. The app never silently downloads or replaces itself.
手动安装更新|Manual installation
数据格式|Data format
升级或导入前会校验项目，发现不兼容时不覆盖。|Projects are validated before import; incompatible data is not overwritten.
本版更新|What's new
画册与展厅统一玻璃操作栏，展厅编辑缩小下限为默认 100%|Shared glass editor panels; gallery editing zoom starts at 100%
画册、展厅、图库统一归档与回收站，可恢复且不删除原图|Consistent archive and trash across books, galleries, and assets
统一项目菜单、设置入口、保存状态与导出分类|Unified project menus, settings, save status, and exports
展厅卡片跟随配置，轻量预览减少列表加载|Lightweight gallery cards reflect scene settings
精简交付包、批量工具条与重复界面|Simplified delivery packages and contextual batch tools
打开诊断日志|Open logs
重新连接本地服务|Reconnect local service
当前为本地构建版本，尚未配置公开自动更新和代码签名。后续 GitHub 发布应只包含程序和代码，不包含作品数据及密钥。|Local preview build: unsigned, with no automatic update feed. Public releases must exclude personal projects and API keys.
← 返回工作台|← Back to workspace
设置只影响工具，不改变作品|Preferences affect the interface, not your work
操作栏透明度|Panel transparency
沿用画册的玻璃遮盖效果；仅影响电脑端编辑界面，不改变作品或导出。|Shared glass panels for desktop editing only. Artwork and exports stay unchanged.
素材存储检查|Check media storage
偏好已保存，立即生效|Preferences saved and applied
客户端缩放已保存|Interface zoom saved
导出诊断信息|Export diagnostics
正在处理…|Working…
操作已完成|Done
操作未完成|Action incomplete
正在保存设置，请稍候|Saving preferences, please wait
正在处理，请完成后返回|Please wait for the current operation to finish
正在读取设置…|Reading preferences…
还没有备份，建议在导入或更新前创建一份。|No backups yet. Create one before importing or updating.
网页开发模式：数据保存在本地服务的仓库目录|Development mode: data is stored with the local service
请先应用或取消当前图片构图。|Apply or cancel the current crop first.
请先关闭当前弹窗。|Close the current dialog first.
项目列表与图库会自动保存。|Project lists and assets save automatically.
本地服务尚未更新，请使用新版客户端打开。|The local service is outdated. Open this project with the updated application.
项目中心|Projects
所有项目已保存|All projects saved
＋ 新建项目|＋ New project
项目类型|Project types
画册|Books
展厅|Galleries
资源与工具|Resources & tools
素材图库|Asset library
生成任务|Generation tasks
统一项目入口，按类型独立保存。图库是公共素材工具，不属于某种项目。|Projects are stored independently by type. The shared asset library serves all formats.
所有画册|All books
搜索画册名称|Search books
视图方式|View mode
卡片视图|Grid view
列表视图|List view
还没有符合条件的画册|No matching books
新建画册|New book
展厅项目列表|Gallery projects
还没有展厅项目|No galleries yet
创建横向展厅，添加作品后展墙会自动延长。|Create a horizontal gallery. The wall extends as you add artwork.
新建展厅|New gallery
选择项目类型|Choose a project type
项目类型决定展示方式；各类项目分别保存。|The project type determines how work is presented. Each collection is stored separately.
关闭|Close
装帧、跨页与翻页展示|Binding, spreads, and page turns
自动延长的横向策展展墙|An expanding horizontal exhibition wall
三种方式任选。正常新建和复制指令无需配置 API。|Choose a workflow. Manual creation and copyable prompts need no API.
关闭新建窗口|Close new project
创建方式|Creation method
正常新建|Create manually
自己导入完整页面|Import finished pages yourself
AI 接口生成|Generate with AI
可选 · 需要 API 与额度|Optional · API and credits required
复制生成指令|Copy an AI prompt
配合图片发给任意 AI|Send with images to your preferred AI
画册名称|Book title
页面规格|Page format
单面比例|Single-page ratio
A 系列比例 · A4 / A5|A-series ratio · A4 / A5
Letter 纸张比例|US Letter ratio
自定义像素尺寸|Custom pixel dimensions
画册方向|Orientation
竖版|Portrait
横版|Landscape
图片精细度|Image resolution
轻量 · 长边 1600 px|Light · 1600 px long edge
标准 · 长边 2400 px|Standard · 2400 px long edge
高清 · 长边 3200 px|High · 3200 px long edge
精细 · 长边 4096 px|Fine · 4096 px long edge
大尺寸 · 长边 6400 px|Large · 6400 px long edge
总面数（含封面封底）|Pages, including covers
自定义单面宽度 / px|Page width / px
自定义单面高度 / px|Page height / px
视觉方向|Visual direction
素材处理|Image treatment
保留完整作品|Preserve finished work
允许裁剪与排版|Allow cropping and layout
允许拆分重新设计|Allow splitting and redesign
主题 / 用途|Theme / purpose
画面风格|Visual style
统一配色|Color palette
背景要求|Background
字体倾向|Typography
更多要求|More requirements
文字 · 内容保护 · 交付格式|Text · content protection · delivery
文字语言|Text language
指令排版形式|Prompt layout
独立单面|Separate pages
跨页设计，交付时拆成单面|Design spreads; deliver separate pages
文字内容|Text content
必须保留（可多选）|Must preserve (multiple)
补充自定义要求|Add custom requirements
避免出现（可多选）|Avoid (multiple)
取消|Cancel
创建并打开|Create & open
正常|Active
已归档|Archived
回收站|Trash
打开编辑|Edit
设备预览|Device preview
展示预览|Preview
重命名|Rename
复制项目|Duplicate project
归档|Archive
取消归档|Unarchive
移入回收站|Move to trash
恢复项目|Restore project
更多展厅操作|More gallery actions
没有符合条件的展厅|No matching galleries
还没有归档的展厅|No archived galleries
展厅回收站为空|Gallery trash is empty
已移入回收站|Moved to trash
横向作品展厅|Horizontal gallery
等待布展|Ready for artwork
项目列表读取失败，请重新打开|Could not load projects. Reopen the collection.
归档仅收起项目或素材，不影响已导出的文件；取消归档即可回到正常列表。|Archiving hides items from the active collection without affecting exports. Unarchive to return them.
移入回收站不会删除原图；恢复后回到移除前的正常或归档状态，不会自动清空。|Trash preserves originals and the previous archive state. Nothing is emptied automatically.
素材分类|Asset folders
全部图片|All images
未分类|Unfiled
＋ 新建分类|＋ New folder
搜索名称或标签|Search names or tags
最新导入|Recently imported
名称排序|Name
文件大小|File size
重命名分类|Rename folder
移除分类|Remove folder
全选当前结果|Select current results
移动到分类|Move to folder
移动分类|Move
设置标签|Set tags
恢复所选|Restore selected
名称|Name
编辑|Edit
确认|Confirm
刷新|Refresh
导入图片|Import images
素材图库 · 独立素材仓库|Asset library · independent storage
图库不直接绑定现有画册。用于展厅时生成独立副本，整理图库不影响已导入的作品。|The library is independent. Galleries import copies, so organizing assets does not alter existing work.
每张最大 25MB · 按内容识别重复图片|Up to 25 MB each · content-based deduplication
这里还没有图片。点击右上角「导入图片」，或调整筛选条件。|No images here. Import images or adjust your filters.
这里还没有图片。导入图片，或调整筛选条件。|No images here. Import images or adjust your filters.
回收站为空，或当前分类没有已移除图片。|Trash is empty, or no removed images match this folder.
还没有归档的图片，或当前筛选没有结果。|No archived images match the current filters.
选择图片后显示批量操作|Select images to see batch actions
未添加标签|No tags
图库已同步|Library up to date
修改已保存|Changes saved
请先选择图片|Select images first
操作未完成，请刷新后重试|Action incomplete. Refresh and try again.
标签（使用逗号分隔，确认后替换所选图片的现有标签）|Tags (comma-separated; replaces existing tags on selected images)
EXHIBITION / 独立展厅仓库|EXHIBITION / INDEPENDENT COLLECTION
展厅名称|Gallery title
尚未创建|Not created yet
展厅仓库|Gallery collection
保存|Save
预览 ↗|Preview ↗
导出展示包|Export presentation
展厅设置|Gallery settings
随作品自然延长的横向展墙。|A horizontal wall that grows with your artwork.
拖动浏览，不是重复循环。|Drag to explore; the wall does not loop.
墙面|Wall
炭黑展墙|Charcoal wall
白色展墙|White wall
暖灰展墙|Warm gray wall
画框|Frame
黑色厚边框|Thick black frame
极细黑框|Fine black frame
暖金属框|Warm metal frame
无边框|Frameless
作品间距|Artwork spacing
整体作品高度|Artwork height
展墙灯光|Gallery lighting
恢复默认|Reset
作品说明牌|Artwork labels
作品清单|Artwork list
添加作品|Add artwork
拖动或用箭头排序|Drag or use arrows to reorder
拖动或使用箭头排序|Drag or use arrows to reorder
当前作品|Selected artwork
作品名称|Artwork title
作品说明|Description
单件尺寸|Artwork size
查看原图|View original
替换|Replace
删除|Remove
上移|Move up
下移|Move down
展厅预览|Gallery preview
拖动 / 滚轮平移 · 双击查看作品|Drag / scroll to pan · double-click for details
回到起点|Back to start
从图库选择|Choose from library
返回画册仓库 ↗|Book collection ↗
与画册仓库独立，作品不会相互混入。|Separate from books; collections never mix.
展厅作品独立存储，不会出现在画册仓库。导出包无需联网即可浏览。|Gallery artwork is stored separately from books. Exported packages work offline.
快速场景预设|Scene presets
选择预设|Choose a preset
保存当前外观预设|Save current appearance
墙面与地面|Wall & floor
灯光与氛围|Lighting & atmosphere
画框与装裱|Frames & matting
排布与尺寸|Layout & sizing
展览信息与开场|Exhibition & opening
地面材质|Floor material
墙面肌理|Wall texture
地面亮泽|Floor sheen
环境明暗|Ambient brightness
灯光强度|Light intensity
灯光色温|Light temperature
照射方向|Light direction
光束扩散|Beam spread
全局画框宽度|Frame width
画框厚度 / 投影|Frame depth / shadow
卡纸留边|Mat width
玻璃反光|Glass reflections
恢复墙面与地面默认值|Reset wall & floor
恢复灯光默认值|Reset lighting
恢复装裱默认值|Reset frames & matting
排布模板|Layout template
单排展墙|Single row
上下双排|Two rows
组合挂画|Salon arrangement
开启展墙拖动布展|Enable artwork arrangement
结束拖动布展|Finish arrangement
恢复规则排布|Reset arrangement
拖动吸附步长|Snap spacing
展览副标题|Subtitle
策展人 / 展示方|Curator / presenter
展览简介|Exhibition introduction
预览与离线包显示进入页|Show opening page in preview and export
展区与章节|Sections & chapters
管理展区与章节|Manage sections
显示展区标题与分隔|Show section headings and dividers
展区间距|Section spacing
相同展区名会归为同一章。排序会整体移动该区作品，区内顺序保持不变。|Artworks with the same section form a chapter. Reordering moves the whole section and keeps its internal order.
上移章节|Move section up
切换展厅|Switch gallery
切换展厅 ▾|Switch gallery ▾
批量信息|Batch details
批量替换|Batch replace
复制作品|Duplicate artwork
整体上移|Move selection up
整体下移|Move selection down
应用到所选作品|Apply to selected artwork
只修改勾选的字段，其他信息保持原样。|Only checked fields change; all other details stay unchanged.
批量修改作品信息|Edit selected artwork details
单件卡纸留边 · 0 为跟随展厅|Individual mat · 0 inherits gallery
单件画框宽度 · 0 为跟随展厅|Individual frame width · 0 inherits gallery
跟随展厅|Inherit gallery
跟随原有展厅|Keep gallery settings
删除这件作品？|Remove this artwork?
将从当前展墙移除，不删除原始文件。本次编辑期间可以撤销恢复。|Remove from the wall without deleting the original file. Undo is available during this session.
白色展厅|White gallery
炭黑影棚|Charcoal studio
暖灰桌面|Warm gray desktop
深红展台|Burgundy stage
隐藏地面|Hide floor
水泥地面|Concrete floor
水磨石|Terrazzo
浅橡木地板|Light oak floor
深胡桃木地板|Dark walnut floor
大理石地面|Marble floor
深色石板|Dark slate
浅色石材|Light stone
浅色大理石|Light marble
深灰墙面|Dark gray wall
森林绿展墙|Forest green wall
纯白展墙|Pure white wall
酒红展墙|Burgundy wall
深蓝展墙|Deep blue wall
清水混凝土|Exposed concrete
手工灰泥|Hand-applied plaster
象牙白灰泥|Ivory plaster
浅橡木墙|Light oak wall
深胡桃木墙|Dark walnut wall
亚麻布艺|Linen
柔和漫射|Soft diffuse
均匀洗墙|Wall wash
轨道射灯|Track spotlights
博物馆聚光|Museum spotlights
侧窗自然光|Window daylight
暖色氛围|Warm atmosphere
冷色影棚|Cool studio
关闭照明|Lighting off
自然木框|Natural wood frame
胡桃木框|Walnut frame
白色画框|White frame
黑色厚框|Thick black frame
浅橡木框|Light oak frame
黄铜金属框|Brass frame
古铜金属框|Bronze frame
拉丝银框|Brushed silver frame
透明亚克力框|Clear acrylic frame
悬浮盒式框|Floating box frame
画布包边|Canvas wrap
画册编辑|Book editor
装帧设置|Binding settings
只改变画册的物理呈现，不改动页面图片内容。|Change the book's physical appearance without altering page images.
规格|Format
材质|Materials
翻页|Page turning
场景|Scene
尺寸比例|Aspect ratio
横版画册|Landscape book
当前为竖版|Currently portrait
页面内容|Page content
完整显示|Fit image
铺满页面|Fill page
留白边距|Page margin
页面顺序|Page order
添加完整页面|Add finished pages
调整图片 / 裁剪构图|Resize / crop image
导出 PDF / 离线互动画册|Export PDF / offline book
替换图片时保留本页构图|Keep crop when replacing this image
替换图片|Replace image
所有更改已保存|All changes saved
编辑中|Editing
立即保存|Save now
客户交付|Customer delivery
导出画册|Export book
封面表面|Cover finish
纸张表面|Paper finish
纸张材质|Paper material
材质应用范围|Apply materials to
整本画册|Entire book
仅内页|Inner pages only
仅封面与封底|Covers only
页边颜色|Page edge color
纸张厚度|Paper thickness
纹理强度|Texture strength
反光强度|Reflection intensity
无质感 · 原图呈现|No texture · original image
不叠加材质，保持原图。|No material overlay; preserve the original image.
无附加质感|No additional texture
细纹美术纸|Fine art paper
哑光艺术纸|Matte art paper
亚麻纹纸|Linen paper
牛皮纸|Kraft paper
布纹封面|Linen cover
哑光覆膜|Matte laminate
细腻触感膜|Soft-touch laminate
墨黑|Ink black
纯白|Pure white
象牙白|Ivory
暖灰|Warm gray
书角圆润度|Corner rounding
只作用于页面边缘|Applies to page edges only
翻页手感|Page-turn feel
自然|Natural
柔和|Soft
利落|Crisp
翻页速度|Page-turn speed
翻页阴影|Page-turn shadow
翻页反馈|Page-turn feedback
展示环境|Presentation scene
展示背景|Background
影棚灯光|Studio lighting
柔光|Soft light
侧光|Side light
色温|Temperature
光照方向微调|Fine-tune light direction
接触阴影|Contact shadows
阴影强度|Shadow strength
阴影柔度|Shadow softness
背景明暗|Background brightness
栏位透明度|Panel transparency
操作栏外观|Panel appearance
自定义背景图|Custom background image
上传自定义背景|Upload background
当前使用内置背景|Using a built-in background
材质与光照都是可关闭的屏幕效果，不覆盖原图。互动展示包保留效果；静态 PDF 默认输出干净原稿。|Materials and lighting are optional screen effects. They never overwrite originals. Interactive exports retain them; static PDFs use clean page images.
撤销|Undo
重做|Redo
返回画册列表|Back to books
返回展厅项目|Back to galleries
合上|Close book
使用左右方向键浏览|Use arrow keys to browse
删除此页|Remove page
复制此页|Duplicate page
封面／封底固定，复制后为普通内页。|Covers stay fixed; duplicates become inner pages.
删除这个页面|Remove this page
封面|Front cover
封底|Back cover
普通页|Inner page
硬页 · 封面|Hard page · front cover
硬页 · 封底|Hard page · back cover
应用并保存|Apply & save
在书页上拖动图片，滚轮或滑块缩放。原图可随时恢复。|Drag the image on the page; use the wheel or slider to zoom. Restore the original at any time.
居中|Center
导出与交付|Export & delivery
导出前会保存当前画册。图片位置与本地展示一致。|The book is saved before export. Image framing matches your local preview.
交付类型|Delivery format
完整展示包 · 推荐|Complete presentation · recommended
PDF · 阅读 / 打印|PDF · reading / printing
PDF 排版|PDF layout
单页 · 每面独立|Single pages
跨页 · 封面封底独立，内页成对|Spreads · separate covers, paired inner pages
图片质量|Image quality
高清 · 原图精度，文件较大|High · original resolution, larger file
轻量 · 适合微信发送|Light · easier to share
PDF 保留图片、裁剪和边距；翻页、灯光与动态阴影仅在互动版中呈现。|PDFs retain images, crops, and margins. Page turns, lighting, and dynamic shadows require the interactive version.
生成并下载|Generate & download
再次下载文件|Download again
保存并返回|Save & return
不保存并返回|Return without saving
返回前是否保存当前画册？|Save the book before returning?
自动保存已开启|Autosave is on
自动保存已开启；点击立即保存，或按 Ctrl+S|Autosave is on. Click to save now, or press Ctrl+S.
选择保存并返回，将在离开前完成最后一次确认。|Save & return completes a final save before leaving.
可以随时恢复，原图和已导出的文件不会被删除。|Restore at any time. Original images and exports are preserved.
移入回收站？|Move to trash?
正在删除…|Removing…
读取失败|Could not load
预览成品|Preview result
最近 30 个任务|Last 30 tasks
还没有任务|No tasks yet
选择任务查看进度与结果。|Select a task to view progress and results.
刷新任务|Refresh tasks
停止后续生成|Stop remaining generation
继续未完成页面（可能收费）|Resume remaining pages (may incur charges)
导入为新画册|Import as a new book
图片大小|Image size
生成指令|Generation prompt
生成指令（可直接修改）|Generation prompt (editable)
按表单生成指令|Build prompt from options
复制指令|Copy prompt
下载 TXT|Download TXT
上传参考图（可选，最多 16 张）|Reference images (optional, up to 16)
排版节奏 / 其他要求|Layout rhythm / other requirements
交付要求|Delivery requirements
每面发起一次图片请求，发生错误即暂停，不自动重试。API 实际尺寸以设置为准；与目标比例不同时可在编辑器中裁剪。AI 文字和排版需要人工检查。|One image request per page. Errors pause the task; there are no automatic retries. API settings determine output size. Adjust mismatched ratios in the editor. Review AI text and layout manually.
图片仅上传到本机；点击开始生成后才发送至所配置服务商。原图不会被覆盖。AI 可能改写文字或细节；如需完全保留已有成品，请使用正常新建。|Images stay local until you start generation, then go to your configured provider. Originals are preserved. AI may alter text or details; use manual creation to preserve finished pages exactly.
关闭窗口不会取消任务；电脑关机或后台退出会中断。已完成图片保留，重启后可手动继续，不会自动重复付费。|Closing this dialog does not cancel generation. Quitting the app interrupts it. Completed images are retained; resume manually after restarting.
复制后，把这段文字与全部图片一起发送给 AI。此功能不会自动上传图片或调用 API，也不会自动新建画册。|Send the copied prompt together with your images to an AI. This feature does not upload, call an API, or create a book automatically.
设置 / 更换接口|Configure / change API
正在读取接口设置…|Reading API settings…
管理素材图库 ↗|Manage asset library ↗
从电脑导入|Import from computer
多选图片，直接加入当前展厅|Select images to add to this gallery
导入独立副本，不影响图库原图|Import independent copies; library originals stay unchanged
支持批量选择，导入后可继续调整顺序与装裱。|Select multiple images; adjust order and framing after importing.
批量添加作品|Add multiple artworks
＋ 批量添加作品|＋ Add multiple artworks
新展厅名称|New gallery title
创建独立展厅|Create gallery
预设名称|Preset name
保存外观预设|Save appearance preset
预设未保存|Preset not saved
预设读取失败|Could not load preset
低性能设备会自动简化|Simplified automatically on lower-performance devices
独立作品射灯|Individual artwork spotlights
场景预设与默认值|Scene presets & defaults
沉浸式客户展示|Immersive presentation
开场封面动效|Opening cover animation
闲置后自动隐藏控制栏|Auto-hide controls when idle
关闭时为竖版|Portrait when off
自定义比例|Custom ratio
BOOK STUDIO · 项目中心|BOOK STUDIO · Projects
BOOK STUDIO · 画册编辑|BOOK STUDIO · Book editor
BOOK STUDIO · 作品展厅|BOOK STUDIO · Gallery
BOOK STUDIO · 素材图库|BOOK STUDIO · Assets
文件|File
保存当前项目|Save project
备份工作台|Back up workspace
退出|Quit
剪切|Cut
复制|Copy
粘贴|Paste
全选|Select all
视图|View
全屏|Fullscreen
恢复界面缩放|Reset interface zoom
帮助|Help
关于 BOOK STUDIO|About BOOK STUDIO
打开外部链接|Open external link
是否在默认浏览器打开外部网站？|Open this external website in your default browser?
打开|Open
本地服务请求失败|Local service request failed
不允许的客户端请求|Untrusted application request
本地服务启动超时，请重试或查看日志。|Local service startup timed out. Retry or check the logs.
本地服务意外停止。已保存的作品仍保留，可重新连接。|The local service stopped unexpectedly. Your saved work is safe. Reconnect to continue.
文件正在导出或保存，请完成后再退出或切换数据。|Files are being exported or saved. Wait before quitting or switching workspaces.
仍有未完成操作或未保存修改，请先回到界面处理。|Complete pending operations or save your changes before quitting.
退出 BOOK STUDIO？|Quit BOOK STUDIO?
已保存的作品保留在本机。退出后会同时关闭预览窗口和本地服务。|Your saved work remains on this computer. Preview windows and the local service will close.
未知目录|Unknown folder
正在处理数据，请稍候|Processing data, please wait
选择旧工作台或数据文件夹|Choose a workspace or data folder
选择 BOOK STUDIO 备份|Choose a BOOK STUDIO backup
BOOK STUDIO 备份|BOOK STUDIO backup
恢复备份|Restore backup
将切换到所选仓库，是否继续？|Switch to the selected workspace?
当前仓库会保留为恢复副本。不会删除或修改导入来源，不导入 API 密钥。|The current workspace is retained as a recovery copy. Import sources stay unchanged. API keys are not imported.
继续|Continue
当前仓库无法生成校验备份，是否继续修复？|A verified backup could not be created. Continue with recovery?
导入/恢复仍会保留整个旧数据目录，不会删除。可先取消并查看日志。|The previous data directory will be retained. Cancel to inspect logs first.
继续并保留旧目录|Continue and retain old data
数据校验或导入失败；原仓库仍保留。|Data validation or import failed. The original workspace is preserved.
JSON 诊断信息|JSON diagnostics
缩放比例无效|Invalid zoom level
界面进程意外停止，请重新连接；已保存的作品仍保留。|The interface stopped unexpectedly. Reconnect; your saved work is safe.
保存 BOOK STUDIO 导出文件|Save BOOK STUDIO export
导出文件未能保存，请重新导出。|The export could not be saved. Please export again.
客户端启动失败|Application startup failed
正在准备你的创作空间|Preparing your creative workspace
启动本地服务，检查项目数据。无需打开浏览器。|Starting the local service and checking your projects. No browser required.
工作台暂时无法启动|The workspace could not start
重新连接|Reconnect
打开日志文件夹|Open logs folder
存储位置|Storage locations
预览|Preview
操作已取消|Operation cancelled
PDF 字体资源缺失，请重新安装完整客户端|The PDF font resource is missing. Reinstall the complete application.
作品尺寸说明|Artwork dimensions
作者、尺寸、展区与单件画框|Artist, dimensions, section and individual frame
单件画框|Individual frame
所属展区 / 章节|Section / chapter
展厅导出与交付|Export and deliver gallery
正在检查…|Checking…
关闭导出窗口|Close export dialog
互动包保留当前场景、画框和导览效果，包含使用指南、作品目录与交付信息。总览图片为二维编排参考，不包含动态灯光。修改作品后需重新导出。|Interactive packages retain the scene, frames and tour options, and include guides and catalogs. Overview images are flat layout references without dynamic lighting. Export again after editing.
交付类型|Delivery type
交付格式|Delivery format
完整离线互动展示包|Complete offline interactive package
整墙总览图片 ZIP|Whole-wall overview ZIP
分展区总览图片 ZIP|Section overview ZIP
开始导出|Start export
再次导出|Export again
再次下载|Download again
重试导出|Retry export
图片完整，可以导出。|Images verified. Ready to export.
正在整理图片、生成目录与指南并打包…|Preparing images, generating catalogs and guides, and packaging…
展示包已生成并开始下载。请完整解压后打开「打开展厅.html」。|The package is ready for download. Extract it completely, then open the gallery HTML entry.
总览图片 ZIP 已生成并开始下载，解压后查看图片；这是二维编排，不含动态灯光。|The overview ZIP is ready. Extract it to view the images; these are flat layouts without dynamic lighting.
迁移会先复制并校验全部文件，原仓库保留。外接磁盘断开时不会自动创建空仓库。|Migration copies and verifies every file and retains the original. A disconnected drive will never be replaced with an empty workspace.
选择备份位置|Choose backup location
迁移作品数据|Migrate project data
选择作品数据位置|Choose project data location
更改备份保存位置？|Change the backup location?
复制并校验作品数据后切换位置？|Copy, verify and switch the project data location?
原位置和已有备份保留，不会删除；请勿在操作时断开磁盘。|The original location and existing backups are retained. Do not disconnect the drive during this operation.
请选择仓库和程序目录以外的独立文件夹。|Choose a separate folder outside the workspace and application directories.
不能使用链接目录。|Linked directories are not supported.
不能使用重定向目录。|Redirected directories are not supported.
目标已存在，请选择另一个空位置|The destination already exists. Choose another empty location.
作品数据位置不可用，请连接原磁盘后重试；不会创建空仓库替代。|Project data is unavailable. Reconnect the original drive and retry. An empty workspace will not be created as a replacement.
中英双语、设置和原生菜单统一，作品原文保持不变|Consistent bilingual settings and native menus, with original artwork text preserved
安全诊断不包含日志、路径、密钥或作品名称|Safe diagnostics exclude logs, paths, credentials and artwork names
支持自选备份位置与校验后迁移数据，保留原仓库|Custom backup locations and verified data migration retain the original workspace
完善导出反馈、手动版本检查与发布验收|Improved export feedback, manual version checks and release validation
版本与反馈|Versions and feedback
仅主动检查官方版本，不会自动下载安装程序。|Check official versions only on request. Installers are never downloaded or applied automatically.
检查更新|Check for updates
版本下载|Download releases
源码仓库|Source repository
问题反馈|Report an issue
官方仓库尚未配置；发布时绑定后即可检查。|The official repository is not configured. Version checks become available once it is linked for release.
官方仓库尚未配置。|The official repository is not configured.
尚无可用发布版本。|No releases are available yet.
版本服务请求受限，请稍后重试。|The version service is rate-limited. Try again later.
发现新版本，请打开版本下载页。|A newer version is available. Open the releases page to download it.
当前已是所选通道的最新版本。|This is the latest version in the selected release channel.
无法检查版本，请稍后重试或打开版本下载页。|Unable to check for updates. Try again later or open the releases page.
诊断信息只含版本、系统、连接状态和数量，不包含作品、日志、路径或 API 密钥。安全问题请使用仓库的私密漏洞报告入口。|Diagnostics contain only version, system, connection status and counts, never artwork, logs, paths or API keys. Report security issues privately through the repository.
正在保存当前修改…|Saving current changes…
正在生成阅读 PDF…|Generating the reading PDF…
正在整理图片、生成阅读 PDF 并打包，大画册可能需要稍等…|Preparing images, generating the reading PDF and packaging. Large books may take a while…
导出文件已保存|The exported file has been saved
打开文件位置|Show in folder
已取消文件保存，可重新下载|Saving was cancelled. You can download the file again.
画册适合翻页阅读；展厅适合横向策展。也可以先在素材图库整理图片。|Use a book for page-by-page reading or a gallery for horizontal exhibitions. You can also start by organizing images in the asset library.
整理素材|Organize images
备份位置不能在作品数据目录内|The backup location cannot be inside project data.
目标磁盘空间不足|There is not enough free space on the destination drive.
迁移校验失败，原仓库未修改|Migration verification failed. The original workspace was not modified.
新位置不能与当前仓库重叠|The new location cannot overlap the current workspace.
不能迁移链接文件|Linked files cannot be migrated.
主动检查官方版本，更新由你手动安装。|Check official versions on request and install updates manually.
当前为未签名公开预览版。独立干净电脑验收尚待完成；升级前请先备份作品。|Unsigned public preview. Independent clean-machine acceptance is pending. Back up your projects before updating.
`.trim().split('\n').map(line=>line.split('|'));
 const en=Object.freeze(Object.fromEntries(entries));
 root.BookStudioEnglish=en;
})(globalThis);
