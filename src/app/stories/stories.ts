import { Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { UidUser } from '../models/models.interface';
import { rStories } from '../models/response.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stories',
  imports: [CommonModule],
  templateUrl: './stories.html',
  styleUrl: './stories.css'
})
export class Stories implements OnChanges, OnDestroy {

  @ViewChild('videoPlayer') videoRef?: ElementRef<HTMLVideoElement>;

  @Input() iUser: number | null = null;
  @Input() sNomUser: string | null = null;
  @Input() sUrlProfile: string | null = null;

  ArrStories: Array<any> = [];

  //sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/";

  viewerOpen = false;
  currentIndex = 0;
  progress = 0;
  isMuted = true;
  timer: any;
  private loadedUserId: number | null = null;
  private ignoreNextClick = false;
  private lastPlayedVideoIndex: number | null = null;

  uIdUser: UidUser = {
    sUid: 0
  }

  constructor(
    private api: ApiServices,
    private toastService: ToastService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['iUser']) {
      this.loadInitialStories();
    }
  }

  ngOnDestroy() {
    this.stopCurrentVideo();
    this.clearTimer();
  }

  refreshStories() {
    if (typeof this.iUser !== 'number' || this.iUser <= 0) {
      return;
    }

    this.loadStories();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.viewerOpen) {
      return;
    }

    if (event.key === 'Escape') {
      this.closeViewer();
    }

    if (event.key === 'ArrowRight') {
      this.nextStory();
    }

    if (event.key === 'ArrowLeft') {
      this.prevStory();
    }
  }

  private loadInitialStories() {
    if (typeof this.iUser !== 'number' || this.iUser <= 0 || this.loadedUserId === this.iUser) {
      return;
    }

    this.loadedUserId = this.iUser;
    this.loadStories();
  }

  loadStories() {
    this.uIdUser.sUid = this.iUser ? this.iUser : 0;

    this.api.getStoriesById(this.uIdUser).subscribe({
      next: (data: rStories) => {

        const ahora = Date.now();
        const seisHorasMs = 6 * 60 * 60 * 1000;

        this.ArrStories = Object.values(data.oStories)
          .filter((item: any) => {
            const fechaMs = new Date(item.fecha).getTime();
            return (ahora - fechaMs) < seisHorasMs;
          });

      },
      error: () => {
        this.toastService.error('Error en cargar las histórias!');
      }
    });
  }

  openViewer(index: number) {
    this.currentIndex = index;
    this.viewerOpen = true;
    this.startStory();
  }

  closeViewer() {
    this.stopCurrentVideo();
    this.viewerOpen = false;
    this.clearTimer();
  }

  startStory() {
    this.clearTimer();
    this.stopCurrentVideo();
    this.progress = 0;
    this.isMuted = true;
    this.lastPlayedVideoIndex = null;

    if (!this.isVideo()) {
      this.startTimer();
    }
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.progress += 1;

      if (this.progress >= 100) {
        this.nextStory();
      }
    }, 50); // 5 segundos aprox
  }

  nextStory() {
    if (this.timer === null && !this.isVideo()) return; // 🔥 protección

    this.clearTimer();
    this.progress = 0;

    if (this.currentIndex < this.ArrStories.length - 1) {
      this.currentIndex++;
      this.startStory();
    } else {
      this.closeViewer();
    }
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null; // 👈 importante
    }
  }

  isVideo(): boolean {
    return this.ArrStories[this.currentIndex]?.mediA_TYPE?.includes('video');
  }

  currentMediaUrl(): string {
    return this.sUrlRps + this.ArrStories[this.currentIndex]?.noM_MEDIA;
  }

  prevStory() {
    this.clearTimer();

    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.startStory();
    }
  }

  onViewerTap(event: MouseEvent) {
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false;
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    if (clickX > rect.width / 2) {
      this.nextStory();
    } else {
      this.prevStory();
    }
  }

  onVideoProgress(event: any) {
    const video = event.target;

    if (video.duration) {
      this.progress = (video.currentTime / video.duration) * 100;
    }
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
      this.lastPlayedVideoIndex = null;
      this.playVideo(this.videoRef?.nativeElement);
    }
  }

  private playVideo(video?: HTMLVideoElement) {
    const currentVideo = video ?? this.videoRef?.nativeElement;

    if (!currentVideo || this.lastPlayedVideoIndex === this.currentIndex) {
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
          this.lastPlayedVideoIndex = this.currentIndex;
        })
        .catch(() => {
          this.lastPlayedVideoIndex = null;
        });
    } else {
      this.lastPlayedVideoIndex = this.currentIndex;
    }
  }

  private stopCurrentVideo() {
    const video = this.videoRef?.nativeElement;

    if (!video) {
      return;
    }

    video.pause();
    video.currentTime = 0;
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

  touchStartX = 0;
  touchEndX = 0;
  isSwiping = false;

  onTouchStart(event: TouchEvent) {
    this.ignoreNextClick = true;
    this.touchStartX = event.touches[0].clientX;
    this.touchEndX = this.touchStartX;
    this.isSwiping = false;

    // ⏱ Detectar HOLD (presionado)
    this.holdTimeout = setTimeout(() => {
      this.isHolding = true;
      this.pauseStory();
    }, 200); // sensibilidad (200ms ideal)
  }

  onTouchMove(event: TouchEvent) {
    this.touchEndX = event.touches[0].clientX;

    const diff = Math.abs(this.touchStartX - this.touchEndX);

    if (diff > 10) {
      this.isSwiping = true;
      clearTimeout(this.holdTimeout);

      this.isHolding = false; // 🔥 CRÍTICO
    }
  }

  onTouchEnd() {
    clearTimeout(this.holdTimeout);

    const diff = this.touchStartX - this.touchEndX;
    const absDiff = Math.abs(diff);
    const threshold = 50;

    if (this.isHolding) {
      this.resumeStory();
    }
    else if (this.isSwiping && absDiff > threshold) {
      // 👉 SWIPE
      if (diff > 0) {
        this.nextStory();
      } else {
        this.prevStory();
      }
    }
    else {
      // 👉 TAP (zona izquierda/derecha REAL)
      const screenWidth = window.innerWidth;
      const touchX = this.touchStartX;

      if (touchX > screenWidth / 2) {
        this.nextStory();
      } else {
        this.prevStory();
      }
    }

    this.isHolding = false;
    this.isSwiping = false;
  }

  pauseStory() {
    this.clearTimer();

    // ⏸️ Si es video → pausarlo
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.pause();
    }
  }

  resumeStory() {
    // ▶️ Imagen → retoma timer
    if (!this.isVideo()) {
      this.startTimer();
    }

    // ▶️ Video → continuar
    const video = this.videoRef?.nativeElement;
    if (video) {
      this.lastPlayedVideoIndex = null;
      this.playVideo(video);
    }
  }

  isHolding = false;
  holdTimeout: any;

}
