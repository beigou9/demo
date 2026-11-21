// 所有场景在这里登记，第一个之后顺序无所谓。新写一个场景：新建文件导出一个继承 BaseScene 的类，
// 构造函数里 super('名字')，再加进下面的数组；切过去用 this.ctx.go('名字')。
import { PlayScene } from './play';
import { SummaryScene } from './summary';
import { TitleScene } from './title';

export const scenes = [TitleScene, PlayScene, SummaryScene];
