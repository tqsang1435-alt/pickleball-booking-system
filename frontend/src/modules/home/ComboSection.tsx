import styles from "@/styles/Home.module.css";

const combos = [
  {
    name: "Combo Cơ bản",
    items: ["Sân 1.5 giờ", "HLV 1.5 giờ"],
    oldPrice: "670.000đ",
    price: "499.000đ",
  },
  {
    name: "Combo Tiêu chuẩn",
    items: ["Sân 2 giờ", "HLV 2 giờ"],
    oldPrice: "940.000đ",
    price: "649.000đ",
  },
  {
    name: "Combo Cao cấp",
    items: ["Sân 2 giờ", "HLV 2 giờ", "Nước + bóng"],
    oldPrice: "990.000đ",
    price: "799.000đ",
  },
];

export default function ComboSection() {
  return (
    <section className={styles.cardSection}>
      <div className={styles.sectionTitle}>
        <h2>Combo ưu đãi</h2>
        <a>Xem tất cả ›</a>
      </div>

      <div className={styles.comboGrid}>
        {combos.map((combo) => (
          <article className={styles.comboCard} key={combo.name}>
            <h3>{combo.name}</h3>

            {combo.items.map((item) => (
              <p key={item}>♡ {item}</p>
            ))}

            <del>{combo.oldPrice}</del>
            <strong>{combo.price}</strong>
            <button>Đặt ngay</button>
          </article>
        ))}
      </div>
    </section>

    

    
  );
}