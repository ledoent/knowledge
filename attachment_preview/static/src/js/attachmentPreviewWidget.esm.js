import {Component, proxy, signal, t} from "@odoo/owl";
import {sprintf} from "@web/core/utils/strings";

export class AttachmentPreviewWidget extends Component {
    static template = "attachment_preview.AttachmentPreviewWidget";

    // Owl 3 dropped useRef as well. A ref is a signal typed t.ref(), bound with
    // t-ref="this.<name>" in the template and READ BY CALLING IT
    // (emoji_picker.js:96-98 and its template).
    currentRef = signal(null, {type: t.ref()});
    iframeRef = signal(null, {type: t.ref()});
    // No `static props`: Owl 3 raises "defines a static props or defaultProps,
    // which Owl 3 ignores" on any component declaring it, and the throw
    // propagates out of whatever mounted it. With no props to declare, core's
    // own answer is to omit it entirely.
    setup() {
        super.setup();
        // This.env.bus, not Component.env.bus: Owl 3 has no static env on
        // Component, and 20.0 core reaches the bus through the instance in all
        // 76 files that use it.
        this.env.bus.addEventListener(
            "open_attachment_preview",
            ({detail: {attachment_id, attachment_info_list}}) =>
                this._onAttachmentPreview(attachment_id, attachment_info_list)
        );
        this.env.bus.addEventListener("hide_attachment_preview", this.hide);
        // Owl 3 dropped useState for proxy(), which core uses the same way
        // (search_panel.js:54, custom_favorite_item.js:22).
        this.state = proxy({activeIndex: 0});
    }

    _onCloseClick() {
        this.hide();
    }

    _onPreviousClick() {
        this.previous();
    }

    _onNextClick() {
        this.next();
    }

    _onPopoutClick() {
        if (!this.attachments[this.state.activeIndex]) return;
        window.open(this.attachments[this.state.activeIndex].previewUrl);
    }

    next() {
        var index = this.state.activeIndex + 1;
        if (index >= this.attachments.length) {
            index = 0;
        }
        this.state.activeIndex = index;
        this.updatePaginator();
        this.loadPreview();
    }

    previous() {
        var index = this.state.activeIndex - 1;
        if (index < 0) {
            index = this.attachments.length - 1;
        }
        this.state.activeIndex = index;
        this.updatePaginator();
        this.loadPreview();
    }

    // Deliberately still document-scoped and still not using `this`: hide is
    // registered on the bus as a bare reference (see setup), so it is called
    // unbound. Keeping it free of `this` is what makes that safe.
    show() {
        for (const el of document.querySelectorAll(".attachment_preview_widget")) {
            el.classList.remove("d-none");
        }
    }

    hide() {
        for (const el of document.querySelectorAll(".attachment_preview_widget")) {
            el.classList.add("d-none");
        }
    }

    updatePaginator() {
        var value = sprintf(
            "%s / %s",
            this.state.activeIndex + 1,
            this.attachments.length
        );
        // Guarded where jQuery used to absorb a null silently: these refs are
        // empty until the widget has rendered, and setAttachments can run first.
        const currentEl = this.currentRef();
        if (currentEl) {
            currentEl.textContent = value;
        }
    }

    loadPreview() {
        const iframeEl = this.iframeRef();
        if (!iframeEl) {
            return;
        }
        if (this.attachments.length === 0) {
            iframeEl.setAttribute("src", "about:blank");
            return;
        }
        var att = this.attachments[this.state.activeIndex];
        iframeEl.setAttribute("src", att.previewUrl);
    }

    setAttachments(attachments, active_attachment_id) {
        this.attachments = attachments;
        if (!attachments) return;
        for (let i = 0; i < attachments.length; ++i) {
            if (parseInt(attachments[i].id, 10) === active_attachment_id) {
                this.state.activeIndex = i;
            }
        }
        this.updatePaginator();
        this.loadPreview();
    }

    _onAttachmentPreview(attachment_id, attachment_info_list) {
        this.setAttachments(attachment_info_list, attachment_id);
        this.show();
    }
}
