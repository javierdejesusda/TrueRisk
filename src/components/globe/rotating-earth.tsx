'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { GeoPermissibleObjects } from 'd3';
import type { FeatureCollection, GeometryObject, GeoJsonProperties } from 'geojson';

interface RotatingEarthProps {
  className?: string;
  onIntroComplete?: () => void;
}

export function RotatingEarth({ className, onIntroComplete }: RotatingEarthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const introCompleteRef = useRef(false);
  const introStartedRef = useRef(false);
  const geoDataRef = useRef<FeatureCollection<GeometryObject, GeoJsonProperties> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions((prev) => {
            if (prev && prev.width === Math.round(width) && prev.height === Math.round(height)) return prev;
            return { width: Math.round(width), height: Math.round(height) };
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !dimensions) return;

    const { width, height } = dimensions;
    const sensitivity = 75;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldSkipIntro = introCompleteRef.current || introStartedRef.current || prefersReducedMotion;

    const startRotation: [number, number] = [40, -20];
    const endRotation: [number, number] = [3.7, -40.4];
    const startScale = Math.min(width, height) / 3.5;
    const endScale = Math.min(width, height) / 0.45;

    const projection = d3.geoOrthographic()
      .scale(shouldSkipIntro ? endScale : startScale)
      .center([0, 0])
      .rotate(shouldSkipIntro ? endRotation : startRotation)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const svgSel = d3.select(svg);
    svgSel.selectAll('*').remove();

    svgSel.attr('viewBox', `0 0 ${width} ${height}`);

    const globe = svgSel.append('circle')
      .attr('fill', '#000000')
      .attr('stroke', 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', '0.5')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale());

    svgSel.append('path')
      .datum(d3.geoGraticule10())
      .attr('d', (d) => path(d as GeoPermissibleObjects) ?? '')
      .style('fill', 'none')
      .style('stroke', 'rgba(255, 255, 255, 0.08)')
      .style('stroke-width', '0.5')
      .attr('class', 'graticule');

    const defs = svgSel.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'halftone')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4);
    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 0.7)
      .attr('fill', '#636366');

    const updatePaths = () => {
      svgSel.selectAll<SVGPathElement, GeoPermissibleObjects>('path').attr('d', (d) => path(d) ?? '');
      globe
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale());
    };

    let rotationTimer: ReturnType<typeof d3.timer> | null = null;
    let introTimer: ReturnType<typeof d3.timer> | null = null;
    const autoRotationTimeout: ReturnType<typeof setTimeout> | null = null;

    const startAutoRotation = () => {
      rotationTimer?.stop();
      rotationTimer = d3.timer(() => {
        const rotate = projection.rotate();
        projection.rotate([rotate[0] + 0.15, rotate[1]]);
        updatePaths();
      });
    };

    const startIntroAnimation = () => {
      introStartedRef.current = true;
      const INTRO_DURATION = 4000;
      const rotInterp = d3.interpolate(startRotation, endRotation);
      const scaleInterp = d3.interpolate(startScale, endScale);

      introTimer = d3.timer((elapsed) => {
        const t = Math.min(elapsed / INTRO_DURATION, 1);
        const eased = d3.easeCubicInOut(t);

        const rot = rotInterp(eased);
        projection.rotate([rot[0], rot[1]]);
        projection.scale(scaleInterp(eased));
        updatePaths();

        if (t >= 0.85 && !introCompleteRef.current) {
          introCompleteRef.current = true;
          onIntroComplete?.();
        }
        if (t >= 1) {
          introTimer?.stop();
          introTimer = null;
        }
      });
    };

    const dragBehavior = d3.drag<SVGSVGElement, unknown>()
      .on('start', () => {
        introTimer?.stop();
        introTimer = null;
        rotationTimer?.stop();
        rotationTimer = null;
      })
      .on('drag', (event) => {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
        updatePaths();
      })
      .on('end', () => {
        startAutoRotation();
      });

    svgSel.call(dragBehavior);

    svgSel.on('wheel', (event: WheelEvent) => {
      event.preventDefault();
      const currentScale = projection.scale();
      const newScale = currentScale * (1 - event.deltaY * 0.001);
      const minScale = Math.min(width, height) / 6;
      const maxScale = Math.min(width, height);
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      projection.scale(clampedScale);
      updatePaths();
    }, { passive: false });

    const renderLand = (land: FeatureCollection<GeometryObject, GeoJsonProperties>) => {
      svgSel.append('g')
        .selectAll('path')
        .data(land.features as GeoPermissibleObjects[])
        .enter().append('path')
        .attr('d', (d) => path(d as GeoPermissibleObjects) ?? '')
        .style('fill', 'url(#halftone)')
        .style('stroke', 'rgba(255, 255, 255, 0.3)')
        .style('stroke-width', '0.5');
    };

    const startAfterLoad = () => {
      setLoaded(true);

      if (shouldSkipIntro) {
        if (!introCompleteRef.current) {
          introCompleteRef.current = true;
          onIntroComplete?.();
        }
      } else {
        startIntroAnimation();
      }
    };

    if (geoDataRef.current) {
      renderLand(geoDataRef.current);
      startAfterLoad();
    } else {
      d3.json<Topology>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data) => {
        if (!data) return;
        const land = topojson.feature(data, data.objects.countries) as FeatureCollection<GeometryObject, GeoJsonProperties>;
        geoDataRef.current = land;
        renderLand(land);
        startAfterLoad();
      });
    }

    return () => {
      introTimer?.stop();
      rotationTimer?.stop();
      if (autoRotationTimeout) clearTimeout(autoRotationTimeout);
    };
  }, [dimensions, onIntroComplete]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      />
    </div>
  );
}
