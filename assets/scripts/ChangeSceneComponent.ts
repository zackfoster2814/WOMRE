import { _decorator, Component, director, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ChangeScreenComponent")
export class ChangeScreenComponent extends Component {
  changeScreen(screenId: string) {
    console.log("SceenId:", screenId);
    director.loadScene("mainscrene", (err) => {
      if (err) {
        console.error(`Failed to load scene: ${screenId}`, err);
      } else {
        console.log(`Scene ${screenId} loaded successfully`);
      }
    });
  }
}
