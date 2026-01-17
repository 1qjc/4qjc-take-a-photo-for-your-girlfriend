"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, Eye, EyeOff, ImagePlus, Download, SwitchCamera, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export function PhotoAlignmentCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [showOverlay, setShowOverlay] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [compareOpacity, setCompareOpacity] = useState(50)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [initialZoom, setInitialZoom] = useState(1)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (stream) {
      startCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(() => {})
      }
    } catch (err) {
      setError("Unable to access camera. Please grant camera permissions.")
      console.error("Error accessing camera:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
    setZoomLevel(1)
  }

  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      setInitialPinchDistance(getDistance(e.touches))
      setInitialZoom(zoomLevel)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      e.preventDefault()
      const currentDistance = getDistance(e.touches)
      const scale = currentDistance / initialPinchDistance
      const newZoom = Math.min(Math.max(initialZoom * scale, 1), 5)
      setZoomLevel(newZoom)
    }
  }

  const handleTouchEnd = () => {
    setInitialPinchDistance(null)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const photoData = canvas.toDataURL("image/png")

    if (!referencePhoto) {
      setReferencePhoto(photoData)
    } else {
      setCapturedPhoto(photoData)
      setIsCompareMode(true)
    }
  }

  const loadPhotoFromLibrary = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setReferencePhoto(result)
      setCapturedPhoto(null)
    }
    reader.readAsDataURL(file)

    event.target.value = ""
  }

  const saveToLibrary = async (photoUrl: string, filename: string) => {
    setIsSaving(true)
    try {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const file = new File([blob], filename, { type: "image/png" })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        })
      } else {
        const link = document.createElement("a")
        link.href = photoUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const link = document.createElement("a")
        link.href = photoUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const resetReference = () => {
    setReferencePhoto(null)
    setCapturedPhoto(null)
    setOverlayOpacity(50)
    setShowOverlay(true)
    setIsCompareMode(false)
    setCompareOpacity(50)
    setZoomLevel(1)
    startCamera()
  }

  const getStateLabel = () => {
    if (!referencePhoto) return "First Grilfriend"
    if (!capturedPhoto) return "Now You"
    return "Compare"
  }

  return (
    <div
      className="flex flex-col flex-1 bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-foreground tracking-tight">Take a Photo for Your Girlfriend</h1>
          <span className="text-xs text-muted-foreground font-mono">{getStateLabel()}</span>
        </div>
        {referencePhoto && (
          <button
            onClick={resetReference}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-black"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center max-w-xs">
              <p className="text-sm font-medium text-foreground mb-2">Camera Access Required</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
            </div>
          </div>
        ) : isCompareMode && referencePhoto && capturedPhoto ? (
          <div className="absolute inset-0 w-full h-full">
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
              style={{
                backgroundImage: `url(${referencePhoto})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: (100 - compareOpacity) / 100,
                transform: `scale(${zoomLevel})`,
              }}
            />
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
              style={{
                backgroundImage: `url(${capturedPhoto})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: compareOpacity / 100,
                transform: `scale(${zoomLevel})`,
              }}
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-75 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {referencePhoto && showOverlay && (
              <div
                className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-75 ease-out"
                style={{
                  backgroundImage: `url(${referencePhoto})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: overlayOpacity / 100,
                  transform: `scale(${zoomLevel})`,
                }}
              />
            )}

            <canvas ref={canvasRef} className="hidden" />

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-5 w-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Initializing camera</p>
                </div>
              </div>
            )}
          </>
        )}

        {!isCompareMode && !error && (
          <button
            onClick={flipCamera}
            className="absolute top-3 right-3 h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/90 hover:bg-black/60 transition-colors"
            aria-label="Flip camera"
          >
            <SwitchCamera className="h-4.5 w-4.5" />
          </button>
        )}

        {zoomLevel > 1 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-mono text-white/90 tabular-nums">{zoomLevel.toFixed(1)}x</span>
          </div>
        )}
      </div>

      <div
        className="bg-background border-t border-border"
      >
        {/* Status text */}
        {/* <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-muted-foreground text-center">
            {!referencePhoto
              ? "Take or load a reference photo"
              : !capturedPhoto
                ? "Position and capture aligned photo"
                : "Adjust blend to compare alignment"}
          </p>
        </div> */}

        {/* Compare mode slider */}
        {isCompareMode && referencePhoto && capturedPhoto && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-mono tabular-nums">{100 - compareOpacity}%</span>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">{compareOpacity}%</span>
            </div>
            <Slider
              value={[compareOpacity]}
              onValueChange={(value) => setCompareOpacity(value[0])}
              min={0}
              max={100}
              step={1}
              className="my-2"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-foreground">Reference</span>
              <span className="text-xs text-foreground">Captured</span>
            </div>
          </div>
        )}

        {/* Overlay opacity slider */}
        {referencePhoto && !capturedPhoto && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-lg border transition-colors",
                  showOverlay
                    ? "border-border bg-secondary text-foreground"
                    : "border-border bg-transparent text-muted-foreground",
                )}
                aria-label={showOverlay ? "Hide overlay" : "Show overlay"}
              >
                {showOverlay ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Overlay</span>
                  <span className="text-xs text-foreground font-mono tabular-nums">{overlayOpacity}%</span>
                </div>
                <Slider
                  value={[overlayOpacity]}
                  onValueChange={(value) => setOverlayOpacity(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!showOverlay}
                  className={cn(!showOverlay && "opacity-40")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 py-4">
          {!capturedPhoto ? (
            <div className="flex items-center gap-3">
              <button
                onClick={capturePhoto}
                disabled={isLoading || !!error}
                className={cn(
                  "flex-1 h-12 flex items-center justify-center gap-2 transition-all",
                  "bg-foreground text-background hover:bg-foreground/90",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <Circle className="h-2 w-2 text-chart-2 fill-chart-2" />
                <span className="text-sm font-medium">{!referencePhoto ? "Capture" : "Capture"}</span>
              </button>
              {!referencePhoto && (
                <Button
                  onClick={loadPhotoFromLibrary}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 gap-2 bg-transparent rounded-none border-border text-foreground hover:bg-secondary"
                >
                  <ImagePlus className="h-4 w-4" />
                  <span className="text-sm">Load</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => saveToLibrary(referencePhoto!, "reference.png")}
                variant="outline"
                size="lg"
                className="flex-1 h-12 gap-2 bg-transparent border-border rounded-none text-foreground hover:bg-secondary"
                disabled={isSaving}
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Reference</span>
              </Button>
              <Button
                onClick={() => saveToLibrary(capturedPhoto, "captured.png")}
                variant="outline"
                size="lg"
                className="flex-1 h-12 gap-2 bg-transparent border-border rounded-none text-foreground hover:bg-secondary"
                disabled={isSaving}
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Captured</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
