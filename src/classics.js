// Hand-picked classic patterns. `check` is verified by verify.js against the engine.
// check: ['still'] | ['osc', p] | ['ship', p] | ['meth', N] (settles around gen N) | ['gun', p] | ['grow']
module.exports = [
  // ---- 静物 ----
  { cat: 'still', name: '方块', en: 'Block', rle: '2o$2o!', check: ['still'], desc: '最小、最常见的静物。随机初始状态里出现得最多的东西。' },
  { cat: 'still', name: '蜂巢', en: 'Beehive', rle: 'b2o$o2bo$b2o!', check: ['still'], desc: '第二常见的静物，六个细胞围成一圈。' },
  { cat: 'still', name: '面包', en: 'Loaf', rle: 'b2o$o2bo$bobo$2bo!', check: ['still'], desc: '第三常见的静物。' },
  { cat: 'still', name: '小船', en: 'Boat', rle: '2o$obo$bo!', check: ['still'], desc: '五个细胞，是滑翔机撞击后常留下的残骸。' },
  { cat: 'still', name: '船', en: 'Ship', rle: '2o$obo$b2o!', check: ['still'], desc: '比小船多一个细胞，两头对称。' },
  { cat: 'still', name: '浴缸', en: 'Tub', rle: 'bo$obo$bo!', check: ['still'], desc: '四个细胞围出一个空洞。' },
  { cat: 'still', name: '池塘', en: 'Pond', rle: 'b2o$o2bo$o2bo$b2o!', check: ['still'], desc: '八个细胞的环。' },
  { cat: 'still', name: '驳船', en: 'Barge', rle: 'bo$obo$bobo$2bo!', check: ['still'], desc: '把浴缸沿对角线拉长一格。' },
  { cat: 'still', name: '长船', en: 'Long boat', rle: '2o$obo$bobo$2bo!', check: ['still'], desc: '小船的加长版。' },
  { cat: 'still', name: '食者', en: 'Eater 1 (fishhook)', rle: '2o$obo$2bo$2b2o!', check: ['still'], desc: '能“吃掉”撞上来的滑翔机并自己复原，是搭建电路的基础零件。1971 年由 Gosper 团队发现。' },
  { cat: 'still', name: '蛇', en: 'Snake', rle: '2obo$ob2o!', check: ['still'], desc: '六个细胞，像一条扭动的蛇。' },
  { cat: 'still', name: '航空母舰', en: 'Aircraft carrier', rle: '2o$o2bo$2b2o!', check: ['still'], desc: '六个细胞的静物，两端是钩子。' },
  { cat: 'still', name: '芒果', en: 'Mango', rle: 'b2o$o2bo$bo2bo$2b2o!', check: ['still'], desc: '斜着放的蜂巢变体。' },
  { cat: 'still', name: '积分号', en: 'Integral sign', rle: '3b2o$2bobo$2bo$obo$2o!', check: ['still'], desc: '形状像数学里的积分符号 ∫。' },

  // ---- 振荡器 ----
  { cat: 'osc', name: '闪光灯', en: 'Blinker', rle: '3o!', check: ['osc', 2], desc: '最小的振荡器：横竖交替，周期 2。' },
  { cat: 'osc', name: '蟾蜍', en: 'Toad', rle: 'b3o$3o!', check: ['osc', 2], desc: '周期 2，两排细胞一呼一吸。' },
  { cat: 'osc', name: '信标', en: 'Beacon', rle: '2o$2o$2b2o$2b2o!', check: ['osc', 2], desc: '两个方块的内角交替亮灭，周期 2。' },
  { cat: 'osc', name: '时钟', en: 'Clock', rle: '2bo$obo$bobo$bo!', check: ['osc', 2], desc: '周期 2，像指针在转。' },
  { cat: 'osc', name: '脉冲星', en: 'Pulsar', rle: '2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!', check: ['osc', 3], desc: '最常见的周期 3 振荡器，四重对称，很漂亮。' },
  { cat: 'osc', name: '宴会主人', en: 'Caterer', rle: '2bo$o3b4o$o3bo$o$3bo$b2o!', check: ['osc', 3], desc: '周期 3，Dean Hickerson 1989 年发现。' },
  { cat: 'osc', name: '八角形 2', en: 'Octagon 2', rle: '3b2o$2bo2bo$bo4bo$o6bo$o6bo$bo4bo$2bo2bo$3b2o!', check: ['osc', 5], desc: '周期 5，形状是八边形。' },
  { cat: 'osc', name: '数字 8', en: 'Figure eight', rle: '3o$3o$3o$3b3o$3b3o$3b3o!', check: ['osc', 8], desc: '两个 3×3 方块斜着相接，周期 8。' },
  { cat: 'osc', name: '科克星系', en: "Kok's galaxy", rle: '6ob2o$6ob2o$7b2o$2o5b2o$2o5b2o$2o5b2o$2o$2ob6o$2ob6o!', check: ['osc', 8], desc: '像旋转的星系，周期 8。Jan Kok 1971 年发现。' },
  { cat: 'osc', name: '翻筋斗', en: 'Tumbler', rle: 'bo5bo$obo3bobo$o2bobo2bo$2bo3bo$2b2ob2o!', check: ['osc', 14], desc: '左右翻转再翻回来，周期 14。' },
  { cat: 'osc', name: '十五项', en: 'Pentadecathlon', rle: '2bo4bo2b$2ob4ob2o$2bo4bo!', check: ['osc', 15], desc: '周期 15，由一排 10 个细胞演化而来。它能反射滑翔机，用处很大。' },
  { cat: 'osc', name: '蜂后穿梭机', en: 'Queen bee shuttle', rle: '9bo$7bobo$6bobo$2o3bo2bo11b2o$2o4bobo11b2o$7bobo$9bo!', check: ['osc', 30], desc: '“蜂后”在两个方块之间来回跑，每次都被方块弹回。高斯帕滑翔机枪就是由两台它组成的。' },

  // ---- 飞船 ----
  { cat: 'ship', name: '滑翔机', en: 'Glider', rle: 'bo$2bo$3o!', check: ['ship', 4], desc: '1970 年由 Richard Guy 发现。每 4 代沿对角线移动一格，是生命游戏里信号的载体，也成了黑客文化的标志。' },
  { cat: 'ship', name: '轻量级飞船', en: 'LWSS', rle: 'bo2bo$o$o3bo$4o!', check: ['ship', 4], desc: '以 c/2 速度直线飞行，是最小的直行飞船。' },
  { cat: 'ship', name: '中量级飞船', en: 'MWSS', rle: '2bo$o3bo$5bo$o4bo$b5o!', check: ['ship', 4], desc: '比轻量级长一格，同样是 c/2。' },
  { cat: 'ship', name: '重量级飞船', en: 'HWSS', rle: '2b2o$o4bo$6bo$o5bo$b6o!', check: ['ship', 4], desc: '三种经典飞船里最大的一种，再加长就会散架。' },
  { cat: 'ship', name: '铜头蛇', en: 'Copperhead', rle: 'b2o2b2o$3b2o$3b2o$obo2bobo$o6bo2$o6bo$b2o2b2o$2b4o2$3b2o$3b2o!', check: ['ship', 10], desc: '2016 年才被发现的 c/10 飞船，说明这片“老土地”上依然有新东西。' },
  { cat: 'ship', name: '游手好闲者', en: 'Loafer', rle: 'b2o2bob2o$o2bo2b2o$bobo$2bo$8bo$6b3o$5bo$6bo$7b2o!', check: ['ship', 7], desc: 'c/7 的慢速飞船，2013 年由 Josh Ball 发现。' },

  // ---- 长寿者（Methuselah）----
  { cat: 'meth', name: 'R-五格骨牌', en: 'R-pentomino', rle: 'b2o$2o$bo!', check: ['meth', 1103], desc: '五个细胞，却要折腾 1103 代才安定下来，期间放出 6 架滑翔机。康威最早研究的图样之一。' },
  { cat: 'meth', name: '橡子', en: 'Acorn', rle: 'bo$3bo$2o2b3o!', check: ['meth', 5206], desc: '七个细胞，5206 代后安定，最终人口 633。Charles Corderman 发现。' },
  { cat: 'meth', name: '顽固者', en: 'Diehard', rle: '6bo$2o$bo3b3o!', check: ['meth', 130], desc: '七个细胞，活满 130 代后全部消失。' },
  { cat: 'meth', name: 'B-七格骨牌', en: 'B-heptomino', rle: 'ob2o$3o$bo!', check: ['meth', 148], desc: '148 代后安定。它在很多枪和飞船的内部反复出现。' },
  { cat: 'meth', name: 'π 七格骨牌', en: 'Pi-heptomino', rle: '3o$obo$obo!', check: ['meth', 173], desc: '形状像 π，173 代后安定。' },
  { cat: 'meth', name: '赫歇尔', en: 'Herschel', rle: 'o$3o$obo$2bo!', check: ['meth', 128], desc: '128 代后安定。它是搭建“赫歇尔电路”的标准信号，很多复杂机器都靠它传递信息。' },
  { cat: 'meth', name: '雷鸟', en: 'Thunderbird', rle: '3o2$bo$bo$bo!', check: ['meth', 243], desc: '243 代后安定。' },
  { cat: 'meth', name: '世纪', en: 'Century', rle: '2b2o$3o$bo!', check: ['meth', 103], desc: '恰好约 100 代后安定，因此得名。' },
  { cat: 'meth', name: '兔子', en: 'Bunnies', rle: 'o5bo$2bo3bo$2bo2bobo$bobo!', check: ['meth', 17332], desc: '10 个细胞，要 17332 代才安定。' },

  // ---- 枪与无限增长 ----
  { cat: 'gun', name: '高斯帕滑翔机枪', en: 'Gosper glider gun', rle: '24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!', check: ['gun', 30], desc: '1970 年 Bill Gosper 发现，赢得康威悬赏的 50 美元：它证明了有限的图样可以无限增长。每 30 代射出一架滑翔机。' },
  { cat: 'gun', name: '辛金滑翔机枪', en: 'Simkin glider gun', rle: '2o5b2o$2o5b2o2$4b2o$4b2o5$22b2ob2o$21bo5bo$21bo6bo2b2o$21b3o3bo3b2o$26bo4$20b2o$20bo$21b3o$23bo!', check: ['gun', 120], desc: '2015 年 Michael Simkin 发现，是细胞数最少的滑翔机枪之一，每 120 代一架。' },
  { cat: 'growth', name: '5×5 无限增长', en: 'Infinite growth 5×5', rle: '3obo$o$3b2o$b2obo$obobo!', check: ['grow'], desc: '能装进 5×5 方框里的、唯一一个会无限增长的图样。它会长成一台不断留下方块的“开关引擎”。' },
  { cat: 'growth', name: '单行无限增长', en: 'One-line infinite growth', rle: '8ob5o3b3o6b7ob5o!', check: ['grow'], desc: '只有一行高的图样，长出两台背靠背的开关引擎。' },
  { cat: 'growth', name: '10 细胞无限增长', en: '10-cell infinite growth', rle: '6bo$4bob2o$4bobo$4bo$2bo$obo!', check: ['grow'], desc: '细胞数最少的无限增长图样，只有 10 个细胞。' },
];
