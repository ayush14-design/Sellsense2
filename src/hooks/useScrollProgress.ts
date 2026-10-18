import { useEffect, useState, useRef } from 'react';

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const newProgress = Math.min(scrollY / docHeight, 1);
      setProgress(newProgress);
      setDirection(scrollY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return { progress, direction };
}

export function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateParallax = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const distance = (viewportCenter - elementCenter) / viewportHeight;
      setOffset(distance * speed * 100);
    };

    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();

    return () => window.removeEventListener('scroll', updateParallax);
  }, [speed]);

  return { ref: elementRef, offset };
}

export function useScrollTrigger<T extends HTMLElement = HTMLElement>(
  threshold = 0.5,
  rootMargin = '0px',
  once = true
) {
  const [isTriggered, setIsTriggered] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsTriggered(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsTriggered(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref: elementRef, isTriggered };
}

export function useHorizontalScroll(_speed = 1) {
  const [scrollX, setScrollX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollX(container.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (index: number, itemWidth: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth',
      });
    }
  };

  return { containerRef, scrollX, scrollTo };
}