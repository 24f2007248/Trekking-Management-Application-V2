const AdminDashboard = {
  components: {
    AdminLayout: window.AdminLayout,
    TableComponent: window.TableComponent,
    StatsCardsComponent: window.StatsCardsComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      adminName: "Admin",

      stats: {
        total_treks: 0,
        total_users: 0,
        total_staff: 0,
        total_bookings: 0
      },

      bookings: []
    };
  },

  computed: {
    adminStats() {
      return [
        {
          title: "Total Treks",
          value: this.stats.total_treks,
          icon: "bi-mountains"
        },
        {
          title: "Total Users",
          value: this.stats.total_users,
          icon: "bi-person"
        },
        {
          title: "Total Staff",
          value: this.stats.total_staff,
          icon: "bi-people"
        },
        {
          title: "Total Bookings",
          value: this.stats.total_bookings,
          icon: "bi-calendar-check"
        }
      ];
    }
  },

  methods: {
    async loadDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard", {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.stats = result.data.stats || {
            total_treks: 0,
            total_users: 0,
            total_staff: 0,
            total_bookings: 0
          };

          this.bookings = result.data.recent_bookings || [];
        } else {
          console.error(result.message || "Failed to load dashboard");
        }

      } catch (err) {
        console.error(err);
      }
    },

    navigate(page) {
      this.$emit("navigate", page);
    },

    async logout() {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      window.location.replace("/");
    }
  },

  mounted() {
    this.loadDashboard();
  },

  template: `
    <AdminLayout
      active-page="dashboard"
      :admin-name="adminName"
      @navigate="navigate"
      @logout="logout"
    >

      <StatsCardsComponent
        :cards="adminStats"
      ></StatsCardsComponent>

      <h4 class="mb-3">
        Recent Bookings
      </h4>

      <TableComponent
        :headers="['Booking ID', 'User', 'Trek', 'Booking Date', 'Status']"
        :keys="['booking_id', 'user_name', 'trek_name', 'booking_date', 'status']"
        :data="bookings"
      ></TableComponent>

      <div class="text-end mt-3">

        <a
          href="#"
          class="text-decoration-none"
          @click.prevent="navigate('admin-bookings')"
        >
          View All Bookings
          <i class="bi bi-arrow-right"></i>
        </a>

      </div>

    </AdminLayout>
  `
};

window.AdminDashboard = AdminDashboard;