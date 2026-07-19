import { Component } from '@angular/core';
import { PoliticaPrivacidad } from '../politica-privacidad/politica-privacidad';
import { TerminosCondiciones } from '../terminos-condiciones/terminos-condiciones';

@Component({
  selector: 'app-legal-modals',
  imports: [TerminosCondiciones, PoliticaPrivacidad],
  templateUrl: './legal-modals.html',
  styleUrl: './legal-modals.css'
})
export class LegalModals {}
