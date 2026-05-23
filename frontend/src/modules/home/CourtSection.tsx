import styles from "@/styles/Home.module.css";

const courts = [
  {
    name: "Sunrise Pickleball Club",
    type: "Trong nhà",
    rating: "4.8",
    price: "120.000đ/giờ",
    location: "Văn Tiến Dũng, Đà Nẵng",
  },
  {
    name: "Air Pickleball Center",
    type: "Ngoài trời",
    rating: "4.7",
    price: "100.000đ/giờ",
 location: "Văn Tiến Dũng, Đà Nẵng",
  },
  {
    name: "Sky Pickleball Arena",
    type: "Trong nhà",
    rating: "4.9",
    price: "150.000đ/giờ",
    location: "Văn Tiến Dũng, Đà Nẵng",
  },
];

export default function CourtSection() {
  return (
    <section className={styles.cardSection}>
      <div className={styles.sectionTitle}>
        <h2>Sân Pickleball nổi bật</h2>
        <a>Xem tất cả ›</a>
      </div>

      <div className={styles.cardGrid}>
        {courts.map((court) => (
          <article className={styles.courtCard} key={court.name}>
            <div className={styles.courtImage}>
              <span>{court.type}</span>
              <button>♡</button>
            </div>

            <h3>{court.name}</h3>
            <p>⭐ {court.rating}</p>
            <p>📍 {court.location}</p>
            <strong>{court.price}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}