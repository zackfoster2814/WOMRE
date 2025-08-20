import { _decorator, Component, director, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ChangeScene2Component")
export class ChangeScene2Component extends Component {
  changeScreen(screenId: string) {
    console.log("SceenId:", screenId);
    director.loadScene("mainscrene2", (err) => {
      if (err) {
        console.error(`Failed to load scene: ${screenId}`, err);
      } else {
        console.log(`Scene ${screenId} loaded successfully`);
      }
    });
  }
}
