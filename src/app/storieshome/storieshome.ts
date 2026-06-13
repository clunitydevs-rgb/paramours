import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MethodService } from '../method/method.service';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-storieshome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './storieshome.html',
  styleUrl: './storieshome.css'
})
export class Storieshome {

  @ViewChild('videoPlayer') videoRef!: ElementRef<HTMLVideoElement>;

  sUrlRps = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";

  storiesAgrupadas: any[] = [];

  currentIndex = 0;
  currentStorieIndex = 0;

  currentProgress = 0;
  animationFrameId: any;
  startTime = 0;
  duration = 5000;

  sFotoPerfil = '';

  bShowFx = true;

  isViewerOpen = false;
  isMuted = true;
  private lastPlayedVideoKey = '';

  constructor(private methodservice: MethodService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    const grupos: any = {};

    this.subscription = this.methodservice.tStoriesHome.subscribe(data => {

      data.forEach((story: any) => {
        if (!grupos[story.iD_USUARIO]) {
          grupos[story.iD_USUARIO] = {
            usuario: story.nomUsuario,
            fotoPerfil: story.fotoPerfilUsuario,
            historias: []
          };
        }

        grupos[story.iD_USUARIO].historias.push(story);
      });

      this.storiesAgrupadas = Object.values(grupos);

      if (this.storiesAgrupadas.length > 0) {
        this.bShowFx = false;
      }
    });

    // SOLO EN BROWSER
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  handleVisibilityChange = () => {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };

  // =========================
  // GETTERS
  // =========================

  get currentStories() {
    return this.storiesAgrupadas[this.currentIndex]?.historias || [];
  }

  get currentStory() {
    return this.currentStories[this.currentStorieIndex];
  }

  get currentGroup() {
    return this.storiesAgrupadas[this.currentIndex];
  }

  get currentUserName(): string {
    return this.currentGroup?.usuario || '';
  }

  get elapsedTimeLabel(): string {
    return this.getElapsedTimeLabel(this.currentStory?.fecha);
  }

  getMediaUrl(story: any) {
    return this.sUrlRps + story.noM_MEDIA;
  }

  isVideo(story: any) {
    return story.mediA_TYPE.includes('video');
  }

  // =========================
  // OPEN
  // =========================

  onPreviewImg(index: number) {
    this.openViewer();
    this.currentIndex = index;
    this.currentStorieIndex = 0;

    this.loadStory();
  }

  // =========================
  // STORY LOAD
  // =========================

  loadStory() {

    // 🔥 limpieza total
    this.stopVideo();

    if (typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    this.currentProgress = 0;
    this.isPaused = false;
    this.isMuted = true;
    this.lastPlayedVideoKey = '';

    const story = this.currentStory;

    this.sFotoPerfil = this.sUrlRps + this.storiesAgrupadas[this.currentIndex].fotoPerfil;

    this.preloadNext();

    if (!this.isVideo(story)) {
      this.startProgress(5000);
    }
  }

  onVideoEnded() {
    // 🔥 evitar doble ejecución
    if (this.isTransitioning) return;

    this.next();
  }

  onVideoLoaded(event: any) {
    const video = event.target;
    this.playVideo(video);
    this.startProgress(video.duration * 1000);
  }

  onVideoReady(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.playVideo(video);
  }

  toggleStoryAudio(event: Event) {
    event.stopPropagation();
    this.isMuted = !this.isMuted;
    this.applyVideoAudioState();

    if (!this.isMuted) {
      this.lastPlayedVideoKey = '';
      this.playVideo(this.videoRef?.nativeElement);
    }
  }

  // =========================
  // PROGRESS
  // =========================

  remainingTime = 0;
  isPaused = false;

  startProgress(duration: number) {

    if (typeof window === 'undefined') return;

    window.cancelAnimationFrame(this.animationFrameId);

    this.duration = duration;
    this.startTime = performance.now();
    this.isPaused = false;

    const animate = (now: number) => {

      if (this.isPaused) return;

      const elapsed = now - this.startTime;
      this.currentProgress = Math.min((elapsed / this.duration) * 100, 100);

      if (this.currentProgress < 100) {
        this.animationFrameId = window.requestAnimationFrame(animate);
      } else {
        this.next();
      }
    };

    this.animationFrameId = window.requestAnimationFrame(animate);
  }

  resetProgress() {
    this.currentProgress = 0;

    if (typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    this.isPaused = false;
  }

  getProgress(i: number): number {
    if (i < this.currentStorieIndex) return 100;
    if (i > this.currentStorieIndex) return 0;
    return this.currentProgress;
  }

  // =========================
  // NAVIGATION
  // =========================

  onTap(event: MouseEvent) {

    // 🔥 si viene de touch → ignorar
    if (this.isTouch) return;

    this.handleTapPosition(event.clientX);
  }

  handleTapPosition(x: number) {
    const width = window.innerWidth;

    if (x < width / 2) {
      this.prev();
    } else {
      this.next();
    }
  }

  isTransitioning = false;

  next() {

    if (this.isTransitioning) return;

    this.isTransitioning = true;

    // 🔥 CLAVE: limpiar video anterior
    this.stopVideo();

    if (typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    this.currentProgress = 0;

    if (this.currentStorieIndex < this.currentStories.length - 1) {
      this.currentStorieIndex++;
      this.loadStory();
    } else if (this.currentIndex < this.storiesAgrupadas.length - 1) {
      this.currentIndex++;
      this.currentStorieIndex = 0;
      this.loadStory();
    } else {
      this.close();
    }

    setTimeout(() => {
      this.isTransitioning = false;
    }, 100);
  }

  prev() {

    this.stopVideo(); // 🔥 también aquí

    this.resetProgress();

    if (this.currentStorieIndex > 0) {
      this.currentStorieIndex--;
      this.loadStory();
      return;
    }

    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentStorieIndex = this.currentStories.length - 1;
      this.loadStory();
    }
  }

  stopVideo() {
    if (this.videoRef?.nativeElement) {
      const video = this.videoRef.nativeElement;

      video.pause();
      video.currentTime = 0;
      video.src = '';
      video.load();
    }

    this.lastPlayedVideoKey = '';
  }

  private playVideo(video?: HTMLVideoElement) {
    const currentVideo = video ?? this.videoRef?.nativeElement;
    const currentVideoKey = `${this.currentIndex}-${this.currentStorieIndex}`;

    if (!currentVideo || this.lastPlayedVideoKey === currentVideoKey) {
      return;
    }

    currentVideo.muted = this.isMuted;
    if (this.isMuted) {
      currentVideo.setAttribute('muted', '');
    } else {
      currentVideo.removeAttribute('muted');
    }
    currentVideo.setAttribute('playsinline', '');
    currentVideo.setAttribute('webkit-playsinline', '');

    const playPromise = currentVideo.play();

    if (playPromise) {
      playPromise
        .then(() => {
          this.lastPlayedVideoKey = currentVideoKey;
        })
        .catch(() => {
          this.lastPlayedVideoKey = '';
        });
    } else {
      this.lastPlayedVideoKey = currentVideoKey;
    }
  }

  private applyVideoAudioState() {
    const video = this.videoRef?.nativeElement;

    if (!video) {
      return;
    }

    video.muted = this.isMuted;
    if (this.isMuted) {
      video.setAttribute('muted', '');
    } else {
      video.removeAttribute('muted');
    }
  }

  // =========================
  // HELPERS
  // =========================

  getElapsedTimeLabel(date: string): string {
    if (!date) {
      return '';
    }

    const diffMs = Date.now() - new Date(date).getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
      return 'recién activada';
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return 'recién activada';
    }

    if (minutes < 60) {
      return `hace ${minutes} min`;
    }

    if (hours < 24) {
      return `hace ${hours} h`;
    }

    return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  }

  openViewer() {
    this.isViewerOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.stopVideo();
    this.isViewerOpen = false;

    if (typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    document.body.style.overflow = 'auto';
  }

  touchStartX = 0;
  touchEndX = 0;
  touchStartTime = 0;

  isHolding = false;
  holdTimeout: any;

  isTouch = false;

  onTouchStart(event: TouchEvent) {
    this.isTouch = true;

    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartTime = Date.now();

    this.startHold();
  }

  onTouchEnd(event: TouchEvent) {

    this.touchEndX = event.changedTouches[0].screenX;

    this.clearHold();

    const timeDiff = Date.now() - this.touchStartTime;
    const diffX = this.touchStartX - this.touchEndX;

    // 👉 SWIPE
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) this.next();
      else this.prev();
    }
    // 👉 TAP
    else if (timeDiff < 200 && !this.isHolding) {
      this.handleTapPosition(this.touchEndX);
    }

    // 🔥 reset flag (con delay para evitar click fantasma)
    setTimeout(() => {
      this.isTouch = false;
    }, 300);
  }

  onMouseDown() {
    this.startHold();
  }

  onMouseUp() {
    this.clearHold();
  }

  startHold() {
    this.isHolding = false;

    this.holdTimeout = setTimeout(() => {
      this.isHolding = true;
      this.pause();
    }, 200); // 200ms como Instagram
  }

  clearHold() {
    clearTimeout(this.holdTimeout);

    if (this.isHolding) {
      this.resume();
    }
  }

  pause() {
    if (this.isPaused) return;

    this.isPaused = true;

    if (typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    const elapsed = performance.now() - this.startTime;

    // 🔥 CLAVE: guardar progreso REAL
    this.currentProgress = (elapsed / this.duration) * 100;

    // 🔥 calcular tiempo restante bien
    this.remainingTime = this.duration - elapsed;

    if (this.videoRef?.nativeElement) {
      this.videoRef.nativeElement.pause();
    }
  }

  resume() {
    if (!this.isPaused) return;

    this.isPaused = false;

    if (this.videoRef?.nativeElement) {
      this.lastPlayedVideoKey = '';
      this.playVideo(this.videoRef.nativeElement);
    }

    // 🔥 recalcular startTime correctamente
    this.startTime = performance.now() - (this.currentProgress / 100) * this.duration;

    const animate = (now: number) => {

      if (this.isPaused) return;

      const elapsed = now - this.startTime;
      this.currentProgress = Math.min((elapsed / this.duration) * 100, 100);

      if (this.currentProgress < 100) {
        this.animationFrameId = window.requestAnimationFrame(animate);
      } else {
        this.next();
      }
    };

    this.animationFrameId = window.requestAnimationFrame(animate);
  }

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      this.next(); // swipe left
    } else {
      this.prev(); // swipe right
    }
  }

  preloadNext() {
    const nextIndex = this.currentStorieIndex + 1;

    if (nextIndex < this.currentStories.length) {
      const nextStory = this.currentStories[nextIndex];
      const url = this.getMediaUrl(nextStory);

      if (this.isVideo(nextStory)) {
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'auto';
      } else {
        const img = new Image();
        img.src = url;
      }
    }
  }

  onContextMenu(event: Event) {
    event.preventDefault();
  }

  subscription: any;

  ngOnDestroy() {

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.cancelAnimationFrame(this.animationFrameId);
    }
  }
}
