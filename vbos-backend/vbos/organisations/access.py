"""
Organisation-scoped visibility for catalog datasets (API + helpers for admin).

When ``settings.VBOS_ORGANISATION_SCOPING`` is False (default), behaviour matches pre-org DRMIS:
any authenticated user sees all published datasets (staff still use ?publication=all).

When True, non-staff users with an ``organisation`` only see:
- published datasets with no owner (national / platform catalog), or
- datasets owned by their organisation, or
- datasets explicitly shared via ``DatasetOrganisationShare`` with ``can_view=True``.

Optional cluster whitelist: if the user's organisation has any ``OrganisationClusterAccess``
rows, only those clusters are visible — except owned/shared datasets (always visible if published).
"""
from __future__ import annotations

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, QuerySet

from vbos.organisations.models import DatasetOrganisationShare, OrganisationClusterAccess


def organisation_scoping_enabled() -> bool:
    return bool(getattr(settings, "VBOS_ORGANISATION_SCOPING", False))


def user_bypasses_org_scoping(user) -> bool:
    if not user.is_authenticated:
        return False
    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return True
    return False


def filter_queryset_for_organisation(qs: QuerySet, request, model) -> QuerySet:
    """
    Further restrict a dataset queryset for organisation rules.
    ``qs`` should already be publication-filtered when appropriate.
    """
    if not organisation_scoping_enabled():
        return qs
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return qs.none()
    if user_bypasses_org_scoping(user):
        return qs

    org_id = getattr(user, "organisation_id", None)
    # Users without an organisation: full published catalog (legacy behaviour)
    if org_id is None:
        return qs

    ct = ContentType.objects.get_for_model(model)
    shared_ids = list(
        DatasetOrganisationShare.objects.filter(
            organisation_id=org_id,
            content_type=ct,
            can_view=True,
        ).values_list("object_id", flat=True)
    )

    A = (
        Q(owning_organisation__isnull=True)
        | Q(owning_organisation_id=org_id)
        | Q(pk__in=shared_ids)
    )

    cluster_rows = OrganisationClusterAccess.objects.filter(
        organisation_id=org_id,
        can_view=True,
    )
    if cluster_rows.exists():
        cids = list(cluster_rows.values_list("cluster_id", flat=True))
        if cids:
            bypass_cluster = Q(owning_organisation_id=org_id) | Q(pk__in=shared_ids)
            if model.__name__ == "RasterDataset":
                cluster_ok = Q(cluster_id__in=cids) | Q(cluster__isnull=True)
            else:
                cluster_ok = Q(cluster_id__in=cids)
            visibility = A & (cluster_ok | bypass_cluster)
        else:
            visibility = A
    else:
        visibility = A

    return qs.filter(visibility)


def user_can_view_dataset(user, dataset) -> bool:
    if not user.is_authenticated:
        return False
    if user_bypasses_org_scoping(user):
        return True
    if not organisation_scoping_enabled():
        return True
    org_id = getattr(user, "organisation_id", None)
    if org_id is None:
        return True
    if getattr(dataset, "owning_organisation_id", None) in (None, org_id):
        return True
    ct = ContentType.objects.get_for_model(dataset.__class__)
    return DatasetOrganisationShare.objects.filter(
        organisation_id=org_id,
        content_type=ct,
        object_id=dataset.pk,
        can_view=True,
    ).exists()


def user_can_edit_dataset(user, dataset) -> bool:
    if not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    if not organisation_scoping_enabled():
        return False
    org_id = getattr(user, "organisation_id", None)
    if org_id is None:
        return False
    ct = ContentType.objects.get_for_model(dataset.__class__)
    if DatasetOrganisationShare.objects.filter(
        organisation_id=org_id,
        content_type=ct,
        object_id=dataset.pk,
        can_edit=True,
    ).exists():
        return True
    if getattr(dataset, "owning_organisation_id", None) != org_id:
        return False
    cid = getattr(dataset, "cluster_id", None)
    if cid is None:
        return OrganisationClusterAccess.objects.filter(
            organisation_id=org_id,
            can_edit=True,
        ).exists()
    return OrganisationClusterAccess.objects.filter(
        organisation_id=org_id,
        cluster_id=cid,
        can_edit=True,
    ).exists()


def user_can_publish_dataset(user, dataset) -> bool:
    if not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    if not organisation_scoping_enabled():
        return False
    org_id = getattr(user, "organisation_id", None)
    if org_id is None:
        return False
    ct = ContentType.objects.get_for_model(dataset.__class__)
    if DatasetOrganisationShare.objects.filter(
        organisation_id=org_id,
        content_type=ct,
        object_id=dataset.pk,
        can_publish=True,
    ).exists():
        return True
    if getattr(dataset, "owning_organisation_id", None) != org_id:
        return False
    cid = getattr(dataset, "cluster_id", None)
    if cid is None:
        return OrganisationClusterAccess.objects.filter(
            organisation_id=org_id,
            can_publish=True,
        ).exists()
    return OrganisationClusterAccess.objects.filter(
        organisation_id=org_id,
        cluster_id=cid,
        can_publish=True,
    ).exists()
