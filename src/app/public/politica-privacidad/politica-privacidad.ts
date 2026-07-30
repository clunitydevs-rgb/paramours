import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-politica-privacidad',
  templateUrl: './politica-privacidad.html',
  styleUrl: '../legal-document.css'
})
export class PoliticaPrivacidad {
  @Input() embedded = false;
}
