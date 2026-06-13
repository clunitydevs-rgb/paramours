/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerSyncfusion } from './syncfusion-license';

registerSyncfusion();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
