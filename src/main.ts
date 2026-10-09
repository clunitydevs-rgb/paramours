/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appConfig } from './app/app.config';
import { App } from './app/app';
bootstrapApplication(App, mergeApplicationConfig(appConfig, {
  providers: [provideAnimations()]
}))
  .catch((err) => console.error(err));
