const StaffDashboard = {
  components: {
    StaffLayout: window.StaffLayout,
    StatsCardsComponent: window.StatsCardsComponent,
    TableComponent: window.TableComponent
  },

  data() {
    return {
      staffName: "Staff Member",

      stats: {
        assigned_treks: 0,
        total_participants: 0,
        open_treks: 0
      },

      assigned_treks_list: []
    };
  },

  computed: {
    statsData() {
      return [
        {
          title: "Assigned Treks",
          value: this.stats.assigned_treks,
          icon: "bi-briefcase"
        },
        {
          title: "Total Participants",
          value: this.stats.total_participants,
          icon: "bi-people"
        },
        {
          title: "Open Treks",
          value: this.stats.open_treks,
          icon: "bi-compass"
        }
      ];
    }
  },

  methods: {
    async loadDashboard() {
      try {
        const response = await fetch("/api/staff/dashboard", {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.stats = result.data.stats;
          this.assigned_treks_list = result.data.assigned_treks;

          if (result.data.staff_name) {
            this.staffName = result.data.staff_name;
          }
        } else {
          alert(result.message || "Failed to load dashboard");
        }
      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    navigate(page) {
      this.$root.currentPage = page;
    },

    async logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } finally {
        this.$root.currentPage = "login-page";
      }
    }
  },

  mounted() {
    this.loadDashboard();
  },

  template: `
    <staff-layout
      active-page="dashboard"
      :staff-name="staffName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">My Dashboard</h2>

      <stats-cards-component
        :cards="statsData"
      ></stats-cards-component>

      <h4 class="mb-3">My Assigned Treks</h4>

      <table-component
        :headers="['Trek Name', 'Location', 'Participants', 'Slots', 'Status']"
        :keys="['name', 'location', 'participants', 'slots', 'status']"
        :data="assigned_treks_list"
      ></table-component>

    </staff-layout>
  `
};

window.StaffDashboard = StaffDashboard;