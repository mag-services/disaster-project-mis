from django import template

register = template.Library()


def _key(*parts):
    return "_".join(str(p).replace(" ", "_") for p in parts)


@register.simple_tag
def pa_key(prov, cat, atype):
    """Physical account field name: pa_Province_Category_Type"""
    return f"pa_{_key(prov, cat, atype)}"


@register.simple_tag
def cm_key(prov, from_cat, to_cat):
    """Change matrix field name: cm_Province_From_To"""
    return f"cm_{_key(prov, from_cat, to_cat)}"


@register.filter
def get_item(d, key):
    """Get dict item by key. Usage: {{ form_fields|get_item:key }}"""
    if d is None:
        return ""
    return d.get(key, "")
