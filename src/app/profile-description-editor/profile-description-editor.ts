import { Component, Input, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { registerSyncfusion } from '../../syncfusion-license';
import {
  EmojiPickerService,
  EmojiSettingsModel,
  HtmlEditorService,
  LinkService,
  QuickToolbarService,
  RichTextEditorComponent,
  RichTextEditorModule,
  ToolbarService,
  ToolbarSettingsModel
} from '@syncfusion/ej2-angular-richtexteditor';

registerSyncfusion();

@Component({
  selector: 'app-profile-description-editor',
  imports: [ReactiveFormsModule, RichTextEditorModule],
  template: `<ejs-richtexteditor [formControl]="control"
    [toolbarSettings]="descriptionToolbar" [emojiPickerSettings]="emojiPickerSettings"
    height="220px" placeholder="Cu&eacute;ntale a los visitantes sobre tus servicios">
  </ejs-richtexteditor>`,
  styleUrl: './profile-description-editor.css',
  providers: [ToolbarService, LinkService, HtmlEditorService, EmojiPickerService, QuickToolbarService]
})
export class ProfileDescriptionEditor {
  @Input({ required: true }) control!: FormControl;
  @ViewChild(RichTextEditorComponent) editor?: RichTextEditorComponent;

  getHtml(): string {
    return this.editor ? this.editor.getHtml() ?? '' : this.control.value ?? '';
  }

  public descriptionToolbar: ToolbarSettingsModel = {
    items: [
      'Undo', 'Redo', '|',
      'Bold', 'Italic', 'Underline', '|',
      'FontSize', 'FontColor', '|',
      'Alignments', '|',
      'OrderedList', 'UnorderedList', '|',
      'CreateLink', 'EmojiPicker'
    ]
  };

  public emojiPickerSettings: EmojiSettingsModel = {
    iconsSet: [{
      name: 'Caras y personas',
      code: '1F600',
      iconCss: 'e-emoji',
      icons: [
        { code: '1F600', desc: 'Sonrisa' },
        { code: '1F602', desc: 'Risa' },
        { code: '1F607', desc: 'Angel' },
        { code: '1F609', desc: 'Guino' },
        { code: '1F60D', desc: 'Enamorado' },
        { code: '1F618', desc: 'Beso' },
        { code: '1F60E', desc: 'Genial' },
        { code: '1F970', desc: 'Con corazones' },
        { code: '1F973', desc: 'Fiesta' }
      ]
    }, {
      name: 'Simbolos',
      code: '2764',
      iconCss: 'e-symbols',
      icons: [
        { code: '2764', desc: 'Corazon' },
        { code: '1F5A4', desc: 'Corazon negro' },
        { code: '1F48B', desc: 'Beso' },
        { code: '1F525', desc: 'Fuego' },
        { code: '1F4A6', desc: 'Gotas' },
        { code: '1F339', desc: 'Rosa' },
        { code: '2714', desc: 'Correcto' }
      ]
    }]
  };

}
