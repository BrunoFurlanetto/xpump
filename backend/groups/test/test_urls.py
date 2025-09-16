from django.test import TestCase
from django.urls import reverse, resolve


class TestUrls(TestCase):
    def test_group_list_url(self):
        url = reverse('groups-list')
        self.assertEqual(resolve(url).view_name, 'groups-list')

    def test_group_detail_url(self):
        url = reverse('groups-detail', kwargs={'pk': 1})
        self.assertEqual(resolve(url).view_name, 'groups-detail')

    def test_group_member_url(self):
        url = reverse('group-members-detail', kwargs={'group_id': 1, 'member_id': 1})
        self.assertEqual(resolve(url).view_name, 'group-members-detail')

