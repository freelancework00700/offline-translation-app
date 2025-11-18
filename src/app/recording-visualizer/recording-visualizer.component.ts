import { Component } from '@angular/core';
import { ModalController, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-recording-visualizer',
  templateUrl: './recording-visualizer.component.html',
  styleUrls: ['./recording-visualizer.component.scss'],
  imports: [IonIcon]
})
export class RecordingVisualizerComponent {
  constructor(private modalCtrl: ModalController) {}

  stop() {
    this.modalCtrl.dismiss();
  }
}
