import {canPreview, showPreview} from "../../utils.esm";
import {BinaryField} from "@web/views/fields/binary/binary_field";
import {_t} from "@web/core/l10n/translation";
import {onMounted} from "@odoo/owl";
import {patch} from "@web/core/utils/patch";
import {sprintf} from "@web/core/utils/strings";
import {useService} from "@web/core/utils/hooks";

patch(BinaryField.prototype, {
    setup() {
        super.setup();
        this.orm = useService("orm");
        onMounted(this._preview_onMounted);
    },

    async _preview_onMounted() {
        if (this.props.record.resId) {
            var extension = await this.orm.call(
                "ir.attachment",
                "get_binary_extension",
                [
                    this.props.record.resModel,
                    this.props.record.evalContext.id,
                    this.props.name,
                    this.props.fileNameField,
                ]
            );
            if (canPreview(extension)) {
                this._renderPreviewButton(extension);
            }
        }
    },

    _renderPreviewButton(extension) {
        // Add a button beside the standard download one. 20.0 renders that as
        // `oi btn btn-link o_download_file_button` with data-icon="download" --
        // FontAwesome is gone, so the old `button.fa-download` selector matches
        // nothing. The semantic class is the stable thing to key on.
        //
        // Scoped to this component's own DOM where Owl still gives it to us, and
        // to the document otherwise; the length check then means an ambiguous
        // page declines to attach rather than decorating another field's button.
        const root = this.__owl__?.bdom?.parentEl || document;
        const dl_buttons = root.querySelectorAll("button.o_download_file_button");
        if (dl_buttons.length !== 1) return;
        const preview_button = document.createElement("button");
        // Type=button: created through document.createElement it would otherwise
        // default to submit, which jQuery's $("<button/>") also did.
        preview_button.type = "button";
        preview_button.className = "btn btn-secondary oi";
        preview_button.setAttribute("data-icon", "open_in_new");
        preview_button.setAttribute("data-tooltip", "Preview");
        preview_button.setAttribute("aria-label", "Preview");
        preview_button.setAttribute("data-extension", extension);
        dl_buttons[0].after(preview_button);
        preview_button.addEventListener("click", this._onPreview.bind(this));
    },

    _onPreview(event) {
        showPreview(
            this.env,
            null,
            sprintf(
                "/web/content?model=%s&field=%s&id=%s",
                this.props.record.resModel,
                this.props.name,
                this.props.record.resId
            ),
            event.currentTarget.getAttribute("data-extension"),
            sprintf(_t("Preview %s"), this.fileName),
            false,
            null
        );
        event.stopPropagation();
    },
});
