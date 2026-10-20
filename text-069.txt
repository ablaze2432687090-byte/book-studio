/* Curated, distinct design directions. Each selection expands into a useful instruction. */
(() => {
  const catalog = {
    theme: [
      ['自动判断素材主题','根据参考图片判断主题与用途，不编造项目事实'],
      ['品牌设计作品集','展示品牌概念、视觉识别与应用案例的设计作品集'],
      ['个人摄影集','以摄影作品为核心，体现拍摄主题与视觉叙事'],
      ['建筑 / 空间项目','建筑、室内或展览空间项目展示，关注空间关系与细节'],
      ['产品 / 工艺展示','产品设计、结构细节、材质与工艺展示'],
      ['时装 / 配饰 Lookbook','服装或配饰系列展示，体现搭配、质感与系列连续性'],
      ['旅行 / 城市记录','旅行经历、城市观察与人文记录'],
      ['婚礼 / 家庭纪念','婚礼、家庭或个人重要时刻的纪念画册'],
      ['艺术 / 展览图录','艺术作品与展览图录，尊重作品本身与展陈信息'],
      ['自然 / 生态观察','自然风景、植物、动物与生态主题观察'],
      ['科技 / 概念提案','科技产品、未来概念或研究提案的视觉展示'],
      ['音乐 / 文化企划','音乐专辑、演出、文化活动或独立企划展示'],
      ['企业 / 服务介绍','公司、服务能力与真实案例介绍'],
      ['餐饮 / 食物专题','食物、餐饮品牌、菜单理念或饮食文化专题'],
    ],
    style: [
      ['跟随参考图风格','提取参考图的视觉语言，统一全册，不额外施加无关风格','自动与克制'],
      ['极简主义','简洁的形体与克制的信息量，明确主次，以适量留白建立秩序','自动与克制'],
      ['画廊图录','作品居于主位，清晰编号和低干扰说明，像艺术展览图录','自动与克制'],
      ['瑞士网格','严格对齐的模块网格、无衬线字体与清晰信息层级','编辑与结构'],
      ['杂志编辑','具有栏目、大小标题和图文层级的编辑式排版，疏密有节奏','编辑与结构'],
      ['建筑档案','理性的尺寸关系、图版编号与细节对照，尊重空间摄影','编辑与结构'],
      ['企业年鉴','稳定的视觉系统、分区明确的信息与案例结构，严谨可信','编辑与结构'],
      ['信息可视化','以结构、图表和数据关系组织页面；不编造缺失数据','编辑与结构'],
      ['奢雅精品','克制的品牌标识、细腻材质和精确比例，避免堆叠装饰','品牌与艺术'],
      ['时尚大片','强烈的摄影主体与大胆裁切、标题尺度，突出系列气质','品牌与艺术'],
      ['包豪斯几何','用基本几何形、功能主义排版与有逻辑的色块关系组织画面','品牌与艺术'],
      ['装饰艺术 Art Deco','有秩序的对称、阶梯几何与精细线条，形成复古装饰艺术气质','品牌与艺术'],
      ['粗野主义','粗粝而直接的版式、醒目字体与非对称结构，仍保证阅读性','品牌与艺术'],
      ['实验字体','以字体的尺度、方向和节奏形成视觉结构，保留文字可读性','品牌与艺术'],
      ['复古印刷','套色、网点和轻微印刷纹理，带有老式出版物气质','复古与手作'],
      ['独立 Zine','个人化的编辑节奏与低干扰手作痕迹，呈现独立刊物气质','复古与手作'],
      ['剪贴拼贴','有逻辑地组合照片、纸片与文字层次，不破坏主体与品牌信息','复古与手作'],
      ['手绘插画','使用与主题相关的手绘线条和插画辅助叙述，不替换核心作品','复古与手作'],
      ['赛博科技','数字界面语汇、锐利网格与局部霓虹，避免无意义装饰','科技与自然'],
      ['太空科幻','深空尺度、星际意象与理性科技排字，保留主体清晰度','科技与自然'],
      ['有机仿生','以自然曲线、生物形态与流动结构组织版面','科技与自然'],
      ['植物标本','细致自然观察、标本式编排和清晰注记，不编造物种信息','科技与自然'],
      ['东方当代','克制的东方构图与现代排字，避免符号化堆砌传统元素','文化与叙事'],
      ['水墨意境','墨色浓淡、虚实与空间节奏，核心摄影和作品内容仍需保留','文化与叙事'],
      ['纪实叙事','以事件、人物或时间线推进阅读，诚实呈现原始内容','文化与叙事'],
      ['童趣绘本','友好而清晰的图形与叙事结构，适当活泼但不过度拥挤','文化与叙事'],
    ],
    palette: [
      ['从参考图提取','由参考图片提取统一配色，避免新增不协调颜色'],
      ['黑白高对比','黑与白为主色，保持强烈明暗关系'],
      ['黑底荧光绿','黑底与荧光绿色重点色，少量灰白辅助文字'],
      ['黑底冷银','黑底、银灰与冷白，突出冷静金属气质'],
      ['黑底香槟金','黑底搭配克制的香槟金与暖白，不使用过量金色'],
      ['象牙白 / 石墨','象牙白、石墨灰与少量黑色，温润克制'],
      ['大地暖色','棕褐、砂岩、米色和陶土色，自然温暖'],
      ['森林绿 / 米白','深森林绿与米白，少量暖灰辅助'],
      ['海军蓝 / 白','深海军蓝与白，保持清晰专业的对比'],
      ['单色蓝阶','以蓝色的明度和饱和度变化建立层级'],
      ['酒红 / 奶油','深酒红、奶油白与少量暖灰'],
      ['陶土 / 沙色','陶土红、沙色与深棕，具有干燥自然质感'],
      ['蓝橙互补','以蓝与橙作为互补重点色，控制用量并保持主次'],
      ['低饱和粉彩','低饱和淡粉、淡蓝与柔和浅色，避免荧光色'],
      ['紫 / 青霓虹','深色基底，紫色与青色霓虹作为局部强调'],
      ['中性灰阶','不同明度的中性灰为主，不加入明显色相'],
      ['多彩色块','明确主色与辅助色，使用高辨识度色块而不形成杂乱彩虹'],
    ],
    background: [
      ['跟随参考图','背景与参考图风格一致，整册保持统一'],
      ['纯黑满版','纯黑背景铺满页面，不出现意外白边'],
      ['深灰满版','低干扰深灰背景铺满页面'],
      ['纯白背景','清洁纯白背景，以清晰排版组织空间'],
      ['暖白艺术纸','暖白背景与细腻轻微纸纹，不干扰图文'],
      ['素色无纹理','从选定配色中选择低干扰素色，保持平整无纹理'],
      ['暗色星空','自然稀疏星空延伸至四周边缘，避免重复星点和意外留白'],
      ['细颗粒胶片','克制的细颗粒背景，保持小字与作品清晰'],
      ['混凝土纹理','低对比混凝土纹理，适合空间或工业主题'],
      ['亚麻 / 纤维','细腻低对比亚麻或纤维纹理，不覆盖作品细节'],
      ['柔和渐变','统一方向与色系的柔和渐变，避免夸张光晕'],
      ['几何分区','使用明确几何区块组织背景与信息，保持对齐秩序'],
      ['摄影满版','使用主题摄影延伸到页面边缘，保护重要主体与文字'],
    ],
    type: [
      ['保留参考图字体','优先保留参考图现有字体语言，统一层级与排字'],
      ['现代无衬线','现代无衬线字体，清晰、干净并保持阅读性'],
      ['优雅衬线','细致衬线字体，适合标题和艺术图录，正文保持易读'],
      ['衬线 / 无衬线搭配','衬线标题搭配无衬线正文，明确区分层级'],
      ['等宽技术体','等宽技术排字，清晰编号与数据标签'],
      ['紧凑窄体','窄体用于重点标题，正文仍使用易读字体'],
      ['几何展示体','具有几何结构的展示字体用于标题，避免正文过度装饰'],
      ['手写 / 手作','克制的手写或手作字形作为局部强调，不牺牲正文阅读'],
      ['中文宋体','中文宋体的书刊气质，注意中英文字体协调'],
      ['书法标题','书法感用于少量标题，正文使用清晰易读字体'],
      ['复古点阵','点阵或数码字体用于重点标题，确保字形与内容准确'],
    ],
    language: [
      ['保留原图语言','保留原图文字与语言，不擅自翻译'],
      ['简体中文','使用简体中文，专有名称保持准确'],
      ['英文','使用英文，保留准确的品牌与项目名称'],
      ['中英双语','使用简体中文与英文双语，控制翻译长度与层级'],
      ['繁体中文','使用繁体中文，专有名称保持准确'],
      ['日文','使用日文，保留准确的品牌与项目名称'],
      ['韩文','使用韩文，保留准确的品牌与项目名称'],
      ['无新增文字','不新增文字，现有作品内部文字保持不变'],
    ],
    copy: [
      ['保留已有文案','优先保留原图已有文字，不编造项目事实'],
      ['仅画册名称与页码','仅新增画册名称与页码，不编造其他文案'],
      ['简短标题与注释','依据素材添加准确简短标题与注释，未知信息留空'],
      ['作品档案式说明','按作品名称、时间、材料等已知信息组织说明；缺失信息不编造'],
      ['少文字，图像为主','只保留必要标题，主体由图片表达，不堆叠长文'],
      ['不新增任何文案','不新增任何文案或页码，保留作品中已有文字'],
    ],
    notes: [
      ['均衡阅读节奏','全册视觉系统统一，疏密与大小有变化，保持适当阅读节奏'],
      ['满版沉浸','以满版图像为主，不出现意外空边，保护主体与中缝'],
      ['疏朗留白','作品之间保持有意的空间，留白服从构图而不是随机空缺'],
      ['一面一个重点','每面设置一个清晰视觉重点，避免分散与杂乱'],
      ['多图对照','将有联系的图片组织为对照组，网格清楚，避免密集挤压'],
      ['按时间推进','根据已知时间线安排内容，不编造时间信息'],
      ['章节叙事','主题分章节，区分章节开场与内容页，形成阅读推进'],
      ['细节与全景交替','在整体图与细节图之间切换尺度，避免同构页面连续重复'],
    ],
    output: [
      ['单面图片 + 命名清单','图片 + 文件命名清单'],
      ['单面图片 + ZIP + PDF','单面图片 + ZIP + 静态 PDF（工具支持时）'],
      ['单面图片 + 跨页预览','单面图片 + 跨页预览 + 文件命名清单（工具支持时）'],
      ['制作方案 + 可编辑内容','逐页制作方案 + 可编辑内容（工具支持时）'],
    ],
  };
  const preserve = [
    ['品牌标志','品牌标志及其形状与比例'], ['品牌 / 项目名称','品牌与项目名称的准确拼写'],
    ['人物特征','人物身份与面部特征'], ['主体与作品细节','图片主体与作品有效细节'],
    ['已有文字','原图文字的准确内容'], ['原有配色','原作品的核心配色'],
    ['原页面内部构图','已设计页面的内部构图，不拆分完整作品'], ['原图阅读顺序','素材原有阅读顺序与内容关系'],
  ];
  const avoid = [
    ['意外白边','意外白边或无意的空白区域'], ['主体裁断','重要主体或文字被裁掉'],
    ['错字 / 编造事实','错别字、虚构项目事实与无法核实的文案'], ['重复页面','重复页面与重复素材凑数'],
    ['过度装饰','与主题无关的装饰或过量特效'], ['排版拥挤','文字重叠、图像挤压与信息拥挤'],
    ['风格跳变','不合理的风格、配色与字体突变'], ['书本效果图','书本透视、桌面场景或翻页界面'],
  ];
  let active = false, customSize = null;
  const field = name => document.getElementById('brief'+name[0].toUpperCase()+name.slice(1));
  const dimensions = (ratio,orientation,longEdge) => {
    if (ratio === 'custom') return null;
    const pair = ratio === 'a-series' ? [1,Math.SQRT2] : ratio === 'letter' ? [17,22] : ratio.split(':').map(Number);
    const short = Math.min(...pair),long=Math.max(...pair),size=Number(longEdge);
    const smaller=Math.round(size*short/long);
    return orientation === 'landscape' ? [size,smaller] : [smaller,size];
  };
  function updateSize() {
    const custom=field('ratio').value==='custom',square=field('ratio').value==='1:1';
    const wasCustom=!field('width').readOnly;
    if (!custom && wasCustom) customSize=[field('width').value,field('height').value];
    if (custom && !wasCustom && customSize) [field('width').value,field('height').value]=customSize;
    const pair=dimensions(field('ratio').value,field('orientation').value,field('resolution').value);
    if(pair) [field('width').value,field('height').value]=pair;
    document.getElementById('briefCustomSize').hidden=!custom;
    document.getElementById('briefResolutionField').hidden=custom;
    field('width').readOnly=field('height').readOnly=!custom;
    field('width').disabled=field('height').disabled=!active || !custom;
    field('resolution').disabled=!active || custom;
    field('orientation').disabled=!active || custom || square;
    const [w,h]=[Number(field('width').value),Number(field('height').value)];
    const direction=w===h?'正方形':w>h?'横版':'竖版';
    document.getElementById('briefSizeSummary').textContent=`单面 ${w} × ${h} px · ${direction}${custom?' · 自定义':` · ${field('ratio').selectedOptions[0].textContent}`}。API 实际输出尺寸以接口设置为准。`;
  }
  function updateCustom(name) {
    const select=field(name),input=document.getElementById(select.id+'Custom'),custom=select.value==='__custom__';
    input.hidden=!custom; input.disabled=!active || !custom; input.required=custom && active;
    const hint=document.getElementById(select.id+'Hint');
    hint.textContent=custom?'可填写自己的要求，切回预设不会清除已填写内容。':select.value;
  }
  function init() {
    for(const [name,entries] of Object.entries(catalog)) {
      const select=field(name),groups=new Map();
      for(const [label,value,group] of entries) {
        const option=document.createElement('option'); option.textContent=label; option.value=value;
        if(group) {if(!groups.has(group)) {const node=document.createElement('optgroup'); node.label=group; groups.set(group,node); select.append(node);} groups.get(group).append(option);}
        else select.append(option);
      }
      const option=document.createElement('option'); option.value='__custom__'; option.textContent='自定义 · 手动填写'; select.append(option);
      select.addEventListener('change',()=>updateCustom(name));
    }
    for(let n=2;n<=16;n++) {const option=document.createElement('option'); option.value=String(n); option.textContent=`${n} 面${n===2?' · 仅封面封底':''}`; field('count').append(option);}
    field('count').value='6';
    for(const [kind,entries] of [['preserve',preserve],['avoid',avoid]]) {
      const node=document.getElementById(kind+'Choices');
      entries.forEach(([label,value],index)=>{
        const wrapper=document.createElement('label'); wrapper.className='checkbox-label';
        const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.value=value; checkbox.dataset.briefChoice=kind;
        checkbox.checked=kind==='avoid' || [0,1,3,4].includes(index); wrapper.append(checkbox,document.createTextNode(label)); node.append(wrapper);
      });
      document.getElementById(kind+'CustomToggle').addEventListener('change',sync);
    }
    ['ratio','orientation','resolution','width','height'].forEach(name=>field(name).addEventListener('change',updateSize));
    ['width','height'].forEach(name=>field(name).addEventListener('input',updateSize));
    field('width').readOnly=field('height').readOnly=true;
    sync(false);
  }
  function sync(enabled=active) {
    // Event objects must not be interpreted as the enabled flag.
    if(typeof enabled==='boolean') active=enabled;
    Object.keys(catalog).forEach(updateCustom);
    for(const kind of ['preserve','avoid']) {
      const checked=document.getElementById(kind+'CustomToggle').checked,input=document.getElementById('brief'+kind[0].toUpperCase()+kind.slice(1)+'Custom');
      input.hidden=!checked; input.disabled=!active || !checked;
    }
    updateSize();
  }
  function resolve(name) {
    if(['preserve','avoid'].includes(name)) {
      const selected=[...document.querySelectorAll(`[data-brief-choice="${name}"]:checked`)].map(input=>globalThis.StudioI18n?.t(input.value)||input.value);
      if(document.getElementById(name+'CustomToggle').checked) selected.push(document.getElementById(fieldId(name)+'Custom').value.trim());
      return selected.filter(Boolean).join('；');
    }
    const select=field(name);
    return select.value==='__custom__' ? document.getElementById(select.id+'Custom').value.trim() : `${select.selectedOptions[0].textContent}: ${globalThis.StudioI18n?.t(select.value)||select.value}`;
  }
  const fieldId=name=>'brief'+name[0].toUpperCase()+name.slice(1);
  window.AlbumBrief={init,sync,resolve,dimensions,catalog};
  init();
})();
