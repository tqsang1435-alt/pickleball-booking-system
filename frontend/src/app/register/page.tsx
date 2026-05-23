import Link from "next/link";
import styles from "@/styles/Auth.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.authPage}>
      <form className={styles.authBox}>
        <h1>REGISTER</h1>

        <div className={styles.inputBox}>
          <input type="text" placeholder="Full name" />
          <span>👤</span>
        </div>

        <div className={styles.inputBox}>
          <input type="email" placeholder="E-mail address" />
          <span>🔒</span>
        </div>

        <div className={styles.inputBox}>
          <input type="tel" placeholder="Phone number" />
          <span>📱</span>
        </div>

        <div className={styles.inputBox}>
          <input type="password" placeholder="Password" />
          <span>🔒</span>
        </div>

        <button type="submit">SIGN UP</button>

        <p className={styles.switchText}>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}