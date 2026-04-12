// Inject a 1×1 invisible tracking pixel before </body>
export function injectTrackingPixel(html: string, trackingId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/tracking/pixel?t=${encodeURIComponent(trackingId)}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;outline:none;text-decoration:none;">`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}\n</body>`);
  }
  return html + "\n" + pixel;
}

// Rewrite all absolute http(s) links for click tracking
export function rewriteLinks(html: string, trackingId: string, baseUrl: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_match, url) => {
    const trackingUrl = `${baseUrl}/api/tracking/lien?t=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
}
