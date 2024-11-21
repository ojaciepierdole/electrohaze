declare module '@react-google-maps/api' {
  export const GoogleMap: any;
  export const LoadScript: any;
  export const Marker: any;
}

declare global {
  interface Window {
    google: typeof google;
  }
} 