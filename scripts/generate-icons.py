#!/usr/bin/env python3
"""Generate rounded, cute app icons for 小星星成长宝"""

import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def rounded_star_points(cx, cy, outer_r, inner_r, points=5, round_factor=0.15):
    """Generate a rounded star path as a list of (x, y) points with extra interpolation for smoothness."""
    raw_points = []
    for i in range(points * 2):
        angle = math.radians(-90 + i * 360 / (points * 2))
        r = outer_r if i % 2 == 0 else inner_r
        raw_points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))

    # Subdivide with bezier-like smoothing
    smoothed = []
    n = len(raw_points)
    subdivisions = 8
    for i in range(n):
        p0 = raw_points[(i - 1) % n]
        p1 = raw_points[i]
        p2 = raw_points[(i + 1) % n]
        p3 = raw_points[(i + 2) % n]
        for t_step in range(subdivisions):
            t = t_step / subdivisions
            # Catmull-Rom spline
            t2 = t * t
            t3 = t2 * t
            x = 0.5 * ((2 * p1[0]) +
                       (-p0[0] + p2[0]) * t +
                       (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0]) * t2 +
                       (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) +
                       (-p0[1] + p2[1]) * t +
                       (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * t2 +
                       (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * t3)
            smoothed.append((x, y))

    # Blend toward circle for extra roundness
    result = []
    avg_r = (outer_r + inner_r) / 2
    for (x, y) in smoothed:
        dx, dy = x - cx, y - cy
        dist = math.sqrt(dx*dx + dy*dy)
        if dist > 0:
            circle_x = cx + avg_r * dx / dist
            circle_y = cy + avg_r * dy / dist
            x = x * (1 - round_factor) + circle_x * round_factor
            y = y * (1 - round_factor) + circle_y * round_factor
        result.append((x, y))

    return result


def draw_rounded_rect(draw, bbox, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = bbox
    r = radius
    # Main rectangles
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    # Corners
    draw.pieslice([x0, y0, x0 + 2*r, y0 + 2*r], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*r, y0, x1, y0 + 2*r], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*r, x0 + 2*r, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*r, y1 - 2*r, x1, y1], 0, 90, fill=fill)


def create_icon(size, output_path, is_maskable=False):
    """Create a cute rounded star icon at the given size."""
    # Use 4x supersampling for smooth edges
    ss = 4
    s = size * ss
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background - warm gradient-like effect
    # Main background with rounded corners
    bg_color_top = (255, 192, 30)      # Warm golden yellow
    bg_color_bottom = (255, 165, 0)    # Deeper orange-gold

    if is_maskable:
        # Maskable icons need full bleed background
        corner_r = int(s * 0.05)
        draw_rounded_rect(draw, [0, 0, s, s], corner_r, bg_color_top)
    else:
        # Standard icon with nice rounded corners
        corner_r = int(s * 0.22)
        draw_rounded_rect(draw, [0, 0, s, s], corner_r, bg_color_top)

    # Subtle gradient overlay (top lighter, bottom deeper)
    for y in range(s):
        alpha = int(40 * (y / s))
        overlay_color = (200, 120, 0, alpha)
        draw.line([(0, y), (s, y)], fill=overlay_color)

    # Star parameters
    cx, cy = s // 2, int(s * 0.46)  # Slightly above center
    if is_maskable:
        outer_r = int(s * 0.28)
    else:
        outer_r = int(s * 0.32)
    inner_r = int(outer_r * 0.45)  # Chubbier inner ratio for cuter look

    # Draw soft shadow for the star
    shadow_offset = int(s * 0.015)
    shadow_points = rounded_star_points(cx, cy + shadow_offset, outer_r + int(s*0.01), inner_r + int(s*0.01), round_factor=0.2)
    shadow_img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_img)
    shadow_draw.polygon(shadow_points, fill=(180, 120, 0, 60))
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=int(s * 0.02)))
    img = Image.alpha_composite(img, shadow_img)
    draw = ImageDraw.Draw(img)

    # Draw the main rounded star (white with slight cream tint)
    star_points = rounded_star_points(cx, cy, outer_r, inner_r, round_factor=0.2)
    draw.polygon(star_points, fill=(255, 255, 255))

    # Draw cute face on the star
    face_cy = cy + int(outer_r * 0.05)

    # Eyes - cute round dots
    eye_r = int(outer_r * 0.08)
    eye_spacing = int(outer_r * 0.25)
    eye_y = face_cy - int(outer_r * 0.05)

    # Left eye
    draw.ellipse([
        cx - eye_spacing - eye_r, eye_y - eye_r,
        cx - eye_spacing + eye_r, eye_y + eye_r
    ], fill=(80, 60, 40))

    # Right eye
    draw.ellipse([
        cx + eye_spacing - eye_r, eye_y - eye_r,
        cx + eye_spacing + eye_r, eye_y + eye_r
    ], fill=(80, 60, 40))

    # Eye highlights (small white dots)
    highlight_r = int(eye_r * 0.45)
    highlight_offset = int(eye_r * 0.3)
    draw.ellipse([
        cx - eye_spacing - highlight_offset - highlight_r, eye_y - highlight_offset - highlight_r,
        cx - eye_spacing - highlight_offset + highlight_r, eye_y - highlight_offset + highlight_r
    ], fill=(255, 255, 255))
    draw.ellipse([
        cx + eye_spacing - highlight_offset - highlight_r, eye_y - highlight_offset - highlight_r,
        cx + eye_spacing - highlight_offset + highlight_r, eye_y - highlight_offset + highlight_r
    ], fill=(255, 255, 255))

    # Cute blush cheeks (soft pink circles)
    blush_r = int(outer_r * 0.1)
    blush_y = face_cy + int(outer_r * 0.08)
    blush_spacing = int(outer_r * 0.38)

    blush_img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    blush_draw = ImageDraw.Draw(blush_img)
    blush_draw.ellipse([
        cx - blush_spacing - blush_r, blush_y - blush_r,
        cx - blush_spacing + blush_r, blush_y + blush_r
    ], fill=(255, 150, 150, 100))
    blush_draw.ellipse([
        cx + blush_spacing - blush_r, blush_y - blush_r,
        cx + blush_spacing + blush_r, blush_y + blush_r
    ], fill=(255, 150, 150, 100))
    blush_img = blush_img.filter(ImageFilter.GaussianBlur(radius=int(s * 0.008)))
    img = Image.alpha_composite(img, blush_img)
    draw = ImageDraw.Draw(img)

    # Cute smile (small arc)
    smile_width = int(outer_r * 0.22)
    smile_y = face_cy + int(outer_r * 0.1)
    smile_thickness = max(int(s * 0.006), 2)
    draw.arc([
        cx - smile_width, smile_y - int(smile_width * 0.5),
        cx + smile_width, smile_y + int(smile_width * 0.8)
    ], 10, 170, fill=(80, 60, 40), width=smile_thickness)

    # Small sparkles around the star for extra cuteness
    sparkle_positions = [
        (cx + int(s * 0.28), cy - int(s * 0.22), int(s * 0.025)),
        (cx - int(s * 0.30), cy - int(s * 0.18), int(s * 0.018)),
        (cx + int(s * 0.18), cy + int(s * 0.28), int(s * 0.015)),
        (cx - int(s * 0.25), cy + int(s * 0.25), int(s * 0.02)),
    ]

    for sx, sy, sr in sparkle_positions:
        # Four-point sparkle
        draw.ellipse([sx - sr, sy - sr//3, sx + sr, sy + sr//3], fill=(255, 255, 255, 200))
        draw.ellipse([sx - sr//3, sy - sr, sx + sr//3, sy + sr], fill=(255, 255, 255, 200))

    # Add app name text at bottom (small, cute)
    text_y = cy + int(s * 0.30)
    text_size = int(s * 0.055)

    # Simple text rendering
    try:
        # Try system fonts
        for font_path in [
            '/System/Library/Fonts/PingFang.ttc',
            '/System/Library/Fonts/STHeiti Light.ttc',
            '/System/Library/Fonts/Hiragino Sans GB.ttc',
        ]:
            try:
                font = ImageFont.truetype(font_path, text_size)
                break
            except:
                continue
        else:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    text = "成长宝"
    bbox_text = draw.textbbox((0, 0), text, font=font)
    tw = bbox_text[2] - bbox_text[0]
    # Draw text shadow
    draw.text((cx - tw//2 + 1, text_y + 1), text, fill=(180, 120, 0, 120), font=font)
    # Draw text
    draw.text((cx - tw//2, text_y), text, fill=(255, 255, 255), font=font)

    # Downsample with high-quality resampling
    img = img.resize((size, size), Image.LANCZOS)

    # Convert to RGB for PNG (no transparency for app icons)
    final = Image.new('RGB', (size, size), (255, 192, 30))
    final.paste(img, mask=img.split()[3])

    final.save(output_path, 'PNG', quality=95)
    print(f"Generated: {output_path} ({size}x{size})")


if __name__ == '__main__':
    base_path = '/Users/Muna/Documents/GitHub/vanvan/public'

    # Generate all required sizes
    create_icon(180, f'{base_path}/apple-touch-icon-180x180.png')
    create_icon(192, f'{base_path}/pwa-192x192.png')
    create_icon(512, f'{base_path}/pwa-512x512.png')
    create_icon(512, f'{base_path}/maskable-icon-512x512.png', is_maskable=True)

    print("\nAll icons generated successfully!")
