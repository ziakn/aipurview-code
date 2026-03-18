import React, { useEffect, useState } from "react";
import { Box, Tooltip, IconButton, Stack, useTheme } from "@mui/material";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table";
import { TableHeader } from "@tiptap/extension-table";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
  Table as TableIcon,
  Link as LinkIcon,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import "./index.css";
import { IRichTextEditorProps } from "../../types/interfaces/i.editor";

const ICON_SIZE = 18;

interface ToolbarItem {
  title: string;
  icon: React.ReactNode;
  action: string;
  isActive?: boolean;
}

const RichTextEditor: React.FC<IRichTextEditorProps> = ({
  onContentChange,
  headerSx,
  initialContent = "",
  isEditable = true,
  toolbar = "basic",
  height = "90px",
  placeholder,
}) => {
  const theme = useTheme();
  const [activeList, setActiveList] = useState<"bulleted" | "numbered" | null>(
    null
  );

  const isFull = toolbar === "full";

  const extensions = [
    StarterKit,
    ...(isFull
      ? [
          Table.configure({ resizable: true }),
          TableRow,
          TableCell,
          TableHeader,
          Underline,
          Link.configure({ openOnClick: false }),
          ...(placeholder
            ? [Placeholder.configure({ placeholder })]
            : []),
        ]
      : placeholder
        ? [Placeholder.configure({ placeholder })]
        : []),
  ];

  const editor = useEditor({
    extensions,
    content: initialContent,
    autofocus: false,
    immediatelyRender: true,
    editable: isEditable,
    onUpdate: ({
      editor,
    }: {
      editor: NonNullable<ReturnType<typeof useEditor>>;
    }) => {
      onContentChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditable);
    }
  }, [editor, isEditable]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const applyFormatting = (type: string) => {
    if (!editor) return;

    const actions: Record<string, () => void> = {
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      underline: () => editor.chain().focus().toggleUnderline().run(),
      bullets: () => {
        editor.chain().focus().toggleBulletList().run();
        setActiveList((prev) => (prev === "bulleted" ? null : "bulleted"));
      },
      numbers: () => {
        editor.chain().focus().toggleOrderedList().run();
        setActiveList((prev) => (prev === "numbered" ? null : "numbered"));
      },
      table: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      addColumn: () => editor.chain().focus().addColumnAfter().run(),
      removeColumn: () => editor.chain().focus().deleteColumn().run(),
      addRow: () => editor.chain().focus().addRowAfter().run(),
      removeRow: () => editor.chain().focus().deleteRow().run(),
      deleteTable: () => editor.chain().focus().deleteTable().run(),
      link: () => {
        const url = window.prompt("Enter URL:");
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      },
    };

    actions[type]?.();
  };

  const basicItems: ToolbarItem[] = [
    { title: "Bold", icon: <Bold size={ICON_SIZE} />, action: "bold" },
    { title: "Italic", icon: <Italic size={ICON_SIZE} />, action: "italic" },
    {
      title: "Bullet list",
      icon: <List size={ICON_SIZE} />,
      action: "bullets",
      isActive: activeList === "bulleted",
    },
    {
      title: "Numbered list",
      icon: <ListOrdered size={ICON_SIZE} />,
      action: "numbers",
      isActive: activeList === "numbered",
    },
  ];

  const fullItems: ToolbarItem[] = [
    ...basicItems,
    {
      title: "Underline",
      icon: <UnderlineIcon size={ICON_SIZE} />,
      action: "underline",
    },
    {
      title: "Insert table",
      icon: <TableIcon size={ICON_SIZE} />,
      action: "table",
    },
    { title: "Link", icon: <LinkIcon size={ICON_SIZE} />, action: "link" },
  ];

  // Show table manipulation buttons when cursor is inside a table
  const isInTable = editor?.isActive("table") ?? false;
  const tableActions: ToolbarItem[] = isInTable
    ? [
        {
          title: "Add column",
          icon: <Plus size={14} />,
          action: "addColumn",
        },
        {
          title: "Remove column",
          icon: <Minus size={14} />,
          action: "removeColumn",
        },
        { title: "Add row", icon: <Plus size={14} />, action: "addRow" },
        {
          title: "Remove row",
          icon: <Minus size={14} />,
          action: "removeRow",
        },
        {
          title: "Delete table",
          icon: <Trash2 size={14} />,
          action: "deleteTable",
        },
      ]
    : [];

  const toolbarItems = [
    ...(isFull ? fullItems : basicItems),
    ...tableActions,
  ];

  return (
    <Stack>
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          border: "1px solid #d0d5dd",
          borderBottom: "none",
          borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
          ...headerSx,
        }}
      >
        {toolbarItems.map(({ title, icon, action, isActive }) => (
          <Tooltip key={action} title={title} sx={{ fontSize: 13 }}>
            {!isEditable ? (
              <span style={{ display: "inline-block" }}>
                <IconButton
                  onClick={() => applyFormatting(action)}
                  disableRipple
                  size="small"
                  color={isActive ? "primary" : "default"}
                  disabled
                >
                  {icon}
                </IconButton>
              </span>
            ) : (
              <IconButton
                onClick={() => applyFormatting(action)}
                disableRipple
                size="small"
                color={isActive ? "primary" : "default"}
              >
                {icon}
              </IconButton>
            )}
          </Tooltip>
        ))}
      </Box>

      {/* Tiptap Editor */}
      <Stack>
        <EditorContent
          className="custom-tip-tap-editor"
          editor={editor}
          style={{
            border: "1px solid #d0d5dd",
            minHeight: height,
            overflowY: "auto",
            padding: "8px",
            paddingTop: "0px",
            borderTop: "none",
            borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
            marginBottom: "5px",
            outline: "none",
            display: "flex",
            alignItems: "flex-start",
          }}
          disabled={!isEditable}
        />
      </Stack>

      <style>
        {`
          .ProseMirror {
            flex: 1;
            outline: none !important;
            box-shadow: none !important;
            white-space: pre-wrap;
          }
          .custom-tip-tap-editor .ProseMirror p {
            margin: 0;
          }
          .custom-tip-tap-editor .ProseMirror table {
            border-collapse: collapse;
            width: 100%;
            margin: 8px 0;
          }
          .custom-tip-tap-editor .ProseMirror th,
          .custom-tip-tap-editor .ProseMirror td {
            border: 1px solid #d0d5dd;
            padding: 6px 8px;
            font-size: 13px;
            min-width: 60px;
          }
          .custom-tip-tap-editor .ProseMirror th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
          .custom-tip-tap-editor .ProseMirror .is-empty::before {
            content: attr(data-placeholder);
            color: #98A2B3;
            pointer-events: none;
            float: left;
            height: 0;
            font-size: 13px;
          }
        `}
      </style>
    </Stack>
  );
};

export default RichTextEditor;
