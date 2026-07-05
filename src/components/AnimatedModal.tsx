'use client';
import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactElement<any>;
  position?: 'right' | 'center';
}

export function AnimatedModal({ isOpen, onClose, children, position = 'right' }: Props) {
  const [render, setRender] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRender(false), 500); 
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!render) return null;

  const overlayBase = "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const overlayPosition = position === 'right' ? "justify-end" : "items-center justify-center p-4";
  const overlayOpacity = visible ? "opacity-100" : "opacity-0";

  // Android/Mac style scale and fade
  let panelState = visible 
    ? "opacity-100 scale-100 translate-y-0" 
    : "opacity-0 scale-[0.92] translate-y-4";
    
  if (position === 'right') {
    panelState = visible 
      ? "opacity-100 scale-100 translate-x-0" 
      : "opacity-0 scale-[0.98] translate-x-8";
  }

  const childClassName = `${children.props.className || ''} transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${panelState}`;

  return (
    <div className={`${overlayBase} ${overlayPosition} ${overlayOpacity}`} onClick={onClose}>
      {React.cloneElement(children, {
        className: childClassName,
        onClick: (e: any) => {
          e.stopPropagation();
          if (children.props.onClick) children.props.onClick(e);
        }
      })}
    </div>
  );
}
