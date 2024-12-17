import { ReactNode } from 'react';

declare module 'recharts' {
  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    children: ReactNode;
  }

  export interface XAxisProps {
    dataKey: string;
    angle?: number;
    height?: number;
  }

  export interface YAxisProps {
    label?: {
      value: string;
      angle: number;
      position: 'insideLeft' | 'insideRight';
    };
  }

  export interface BarProps {
    dataKey: string;
    fill?: string;
    shape?: (props: {
      x: number;
      y: number;
      width: number;
      height: number;
      index: number;
      value: number;
    }) => React.ReactNode;
  }

  export interface TooltipProps {}
  export interface BarChartProps {
    data: Array<{
      label: string;
      value: number;
      [key: string]: unknown;
    }>;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    children?: ReactNode;
  }
}

declare module 'lucide-react' {
  export interface LucideProps {
    size?: number;
    color?: string;
    className?: string;
    'aria-label'?: string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'responsive-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      'bar-chart': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      'x-axis': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      'y-axis': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      'tooltip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      'bar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      html: React.DetailedHTMLProps<React.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>;
      head: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>;
      link: React.DetailedHTMLProps<React.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>;
      meta: React.DetailedHTMLProps<React.MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>;
      title: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTitleElement>, HTMLTitleElement>;
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
      option: React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      svg: React.SVGProps<SVGSVGElement>;
      g: React.SVGProps<SVGGElement>;
      path: React.SVGProps<SVGPathElement>;
      rect: React.SVGProps<SVGRectElement>;
      text: React.SVGProps<SVGTextElement>;
      defs: React.SVGProps<SVGDefsElement>;
      filter: React.SVGProps<SVGFilterElement>;
      feDropShadow: React.SVGProps<SVGFEDropShadowElement>;
      body: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>;
    }
  }
} 