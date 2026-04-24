"""Template tags for rendering vector map icons in admin."""
from django import template
from django.utils.safestring import mark_safe

# SVG paths matching frontend vectorIcons.ts (Lucide icons, 24x24)
# Used for admin preview if needed; form uses dropdown
ICON_SVGS = {
    "": None,
    "circle": '<circle cx="12" cy="12" r="6" fill="currentColor"/>',
    "graduationCap": (
        '<path d="M22 10v6M2 10l10-5.5L22 10l-10 5.5L2 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "cross": '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    "mapPin": (
        '<path d="M18 8c0 4.5-6 12-6 12s-6-7.5-6-12a6 6 0 0 1 12 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<circle cx="12" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>'
    ),
    "droplet": '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    "school": (
        '<path d="M14 21v-3a2 2 0 0 0-4 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M18 5v16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M6 5v16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<circle cx="12" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="2"/>'
    ),
    "hospital": (
        '<path d="M12 7v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M14 21v-3a2 2 0 0 0-4 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M14 9h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "heart": '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    "bookOpen": (
        '<path d="M12 7v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "building": (
        '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 8h.01M10 8h.01M14 8h.01M18 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    ),
    "tent": (
        '<path d="M3.5 21 14 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M20.5 21 10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M15.5 21 12 15l-3.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M2 21h20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "treePine": (
        '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M12 22v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "factory": (
        '<path d="M12 16h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M16 16h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M8 16h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "landmark": (
        '<path d="M10 18v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M14 18v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M18 18v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M3 22h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M6 18v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "square": '<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"/>',
    "triangle": '<path d="M12 4 4 20h16L12 4z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
    "star": '<path d="m12 2 3 7 7 1-5 5 1.5 7L12 17l-6.5 3.5L8 15l-5-5 7-1 3-7z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
}

register = template.Library()


@register.simple_tag
def icon_svg(icon_key, size=28, color="#3d4aff"):
    """Return SVG HTML for an icon key."""
    path = ICON_SVGS.get(icon_key)
    if not path:
        return ""
    colored = path.replace("currentColor", color)
    return mark_safe(f'<svg viewBox="0 0 24 24" width="{size}" height="{size}">{colored}</svg>')
