# Copyright 2018 Onestein
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo.addons.base.tests.common import BaseCommon
from odoo.addons.mail.tools.discuss import Store


class TestAttachmentPreview(BaseCommon):
    def test_get_extension(self):
        attachment = self.env["ir.attachment"].create(
            {
                "raw": b"from this, to that.",
                "name": "doc.txt",
            }
        )
        attachment2 = self.env["ir.attachment"].create(
            {
                "raw": b"Png",
                "name": "image.png",
            }
        )
        attachment3 = self.env["ir.attachment"].create(
            {
                "raw": b"Png",
                "name": "image",
            }
        )
        res = self.env["ir.attachment"].get_attachment_extension(attachment.id)
        self.assertEqual(res, "txt")
        store = Store()
        store.add(attachment, "_store_attachment_fields")
        store_data = store.as_dict()
        self.assertIn("extension", store_data["ir.attachment"][0])
        res = self.env["ir.attachment"].get_attachment_extension(
            [attachment.id, attachment2.id]
        )
        self.assertEqual(res[attachment.id], "txt")
        self.assertEqual(res[attachment2.id], "png")

        res2 = self.env["ir.attachment"].get_binary_extension(
            "ir.attachment", attachment.id, "raw"
        )
        self.assertTrue(res2)

        # sudo: 20.0's BaseCommon runs each test as a non-superuser test user
        # holding base.group_user, where 19.0 left cls.env as the superuser, and
        # ir.module.module is readable only by base.group_system. This block is
        # here for a model with a Binary field that is not an attachment, not to
        # assert anything about module access, so it reads as the superuser --
        # which is what 19.0 did for the whole test.
        module = (
            self.env["ir.module.module"]
            .sudo()
            .search([])
            .filtered(lambda m: m.icon_image)[0]
        )
        res3 = (
            self.env["ir.attachment"]
            .sudo()
            .get_binary_extension("ir.module.module", module.id, "icon_image")
        )
        self.assertTrue(res3)

        res4 = self.env["ir.attachment"].get_binary_extension(
            "ir.attachment", attachment3.id, "raw", "name"
        )
        self.assertTrue(res4)

        res5 = self.env["ir.attachment"].get_binary_extension(
            "ir.attachment", attachment.id, None
        )
        self.assertFalse(res5)

        res6 = self.env["ir.attachment"].get_binary_extension(
            "ir.attachment", attachment3.id, "raw", "dummy"
        )
        self.assertTrue(res6)
