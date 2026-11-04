/**
 * Import Theme from IntelliJ IDE: the theme plugins installed in the JetBrains
 * IDEs on this machine, the ones the IDEs use first; the chosen one is
 * imported (`importIntellijTheme`). A file can be chosen instead.
 */
import { useEffect, useState } from "react";
import type { InstalledIntellijTheme } from "@/bindings";
import { tx } from "@/platform/i18n";
import { Badge, Dialog, List, Spinner, T } from "@/ui";
import { pluginsBackend } from "./backend";
import { closeInstalledIntellijThemes, importIntellijTheme, useIntellijThemesDialog } from "./intellijImport";
import { errorText } from "./store";
import styles from "./PluginsPage.module.css";

function IntellijThemesDialog() {
  const [themes, setThemes] = useState<InstalledIntellijTheme[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    let live = true;
    pluginsBackend()
      .installedIntellijThemes()
      .then(
        (found) => live && setThemes(found),
        (e: unknown) => {
          if (!live) return;
          setError(errorText(e));
          setThemes([]);
        },
      );
    return () => {
      live = false;
    };
  }, []);

  const run = (theme?: InstalledIntellijTheme) => {
    const { onImported } = useIntellijThemesDialog.getState();
    closeInstalledIntellijThemes();
    void importIntellijTheme(theme?.path, theme?.themeId).then((id) => id && onImported?.(id));
  };
  const chosen = themes?.[active];

  return (
    <Dialog
      open
      title="Import Theme from IntelliJ IDE"
      width={640}
      onClose={closeInstalledIntellijThemes}
      buttons={[
        { label: "Choose File…", role: "extra", onClick: () => run() },
        { label: "Cancel", role: "cancel" },
        { label: "Import", role: "default", disabled: !chosen, onClick: () => chosen && run(chosen) },
      ]}
    >
      <div className={styles.intellijThemes}>
        <p className={styles.muted}>
          <T>
            Theme plugins installed in the JetBrains IDEs on this computer. The chosen plugin is converted into an
            OpenIDEA theme plugin with all its themes. Colours without an OpenIDEA counterpart keep the default theme
            colours.
          </T>
        </p>
        {themes === null ? (
          <div className={styles.intellijThemesStatus}>
            <Spinner size={14} label="Looking for IntelliJ themes" />
            <T>Looking for IntelliJ themes…</T>
          </div>
        ) : (
          <List
            items={themes}
            getKey={(t) => `${t.ide}\n${t.path}\n${t.themeId}`}
            activeIndex={Math.min(active, Math.max(themes.length - 1, 0))}
            onActiveChange={setActive}
            rowHeight={44}
            className={styles.intellijThemesList}
            aria-label={tx("IntelliJ themes")}
            empty={
              <div className={styles.intellijThemesStatus} role="note">
                {error ?? (
                  <T>
                    No theme plugins found in JetBrains IDEs on this computer. Choose a theme plugin downloaded from the
                    JetBrains Marketplace (.jar or .zip) or a .theme.json file instead.
                  </T>
                )}
              </div>
            }
            renderItem={(t) => (
              <div className={styles.intellijTheme}>
                <div className={styles.intellijThemeLine}>
                  <span className={styles.itemMain}>{t.themeName}</span>
                  {t.active && <Badge tone="accent">{tx("In use")}</Badge>}
                  <span className={styles.muted}>{t.dark ? tx("Dark") : tx("Light")}</span>
                </div>
                <div className={styles.intellijThemeLine}>
                  <span className={styles.intellijThemeDetail}>{t.plugin}</span>
                  <span className={styles.muted}>{t.ide}</span>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </Dialog>
  );
}

/** Overlay of the dialog while `showInstalledIntellijThemes` has it open. */
export function IntellijThemesDialogHost() {
  const open = useIntellijThemesDialog((s) => s.open);
  return open ? <IntellijThemesDialog /> : null;
}
