import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: string;
  title: string;
  detail?: string;
}

export default function EmptyState({ icon = "∅", title, detail }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.title}>{title}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
    </div>
  );
}
