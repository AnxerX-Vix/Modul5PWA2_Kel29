import { useState, useEffect, useRef } from 'react'

// Placeholder transparan 1x1 SVG agar kartu tetap memiliki dimensi sebelum gambar di-load
const TRANSPARENT_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg=='

/**
 * LazyImage — Komponen strict image lazy loading menggunakan IntersectionObserver.
 * Gambar asli TIDAK akan di-download oleh browser sampai elemen kartu benar-benar
 * masuk ke viewport pengguna (rootMargin: '0px', threshold: 0.01).
 *
 * @param {Object} props
 * @param {string} props.src         - URL gambar asli
 * @param {string} [props.alt]       - Deskripsi alternatif gambar
 * @param {string} [props.className] - CSS class
 * @param {number|string} [props.width]  - Lebar tampilan
 * @param {number|string} [props.height] - Tinggi tampilan
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  width,
  height,
  ...rest
}) {
  const supportsObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window
  const [imageSrc, setImageSrc] = useState(() => (supportsObserver ? TRANSPARENT_PLACEHOLDER : src))
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!supportsObserver) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Begitu kartu masuk ke layar, pasang URL asli ke atribut src
          if (entry.isIntersecting) {
            setImageSrc(src)
            // Lepas observasi karena gambar sudah mulai diunduh
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '0px',
        threshold: 0.01,
      },
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [src, supportsObserver])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'lazy-image--loaded' : 'lazy-image--loading'}`}
      width={width}
      height={height}
      onLoad={() => {
        if (imageSrc !== TRANSPARENT_PLACEHOLDER) {
          setIsLoaded(true)
        }
      }}
      {...rest}
    />
  )
}
