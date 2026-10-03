import {canPreview, showPreview} from "../utils.esm";
import {AttachmentList} from "@mail/core/common/attachment_list";
import {patch} from "@web/core/utils/patch";

patch(AttachmentList.prototype, {
    _onPreviewAttachment(attachment, ev) {
        // The event is passed in rather than read off the implicit global
        // `window.event`, which is only set while a native handler is on the
        // stack -- Owl 3 calls this through a wrapper, so the global was
        // undefined here and the click did nothing at all, silently.
        var target = ev.currentTarget;
        var split_screen = target.getAttribute("data-target") !== "new";
        showPreview(
            this.env,
            attachment.id,
            attachment.defaultSource,
            attachment.extension,
            attachment.filename,
            split_screen,
            // 20.0 dropped AttachmentList.previewableAttachments. Core builds
            // the same list inline in its own onClickAttachment
            // (attachment_list.js:166), so take it from there: without it the
            // list is undefined, showPreview falls through to its window.open
            // branch, and the side panel silently never opens.
            this.props.attachmentGroups.map((group) => group.attachment)
        );
    },

    _canPreviewAttachment(attachment) {
        return canPreview(attachment.extension);
    },
});
