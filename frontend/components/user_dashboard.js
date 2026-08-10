const UserDashboard = {
  components: {
    UserLayout: window.UserLayout,
    StatsCardsComponent: window.StatsCardsComponent,
    TableComponent: window.TableComponent
  },

  data() {
    return {
      userName: "User Member",

      available_treks: [],
      my_bookings: [],
      completed_count: 0
    };
  },

  computed: {
    statsData() {
      return [
        {
          title: "Available Treks",
          value: this.available_treks.length,
          icon: "bi-tree-fill"
        },
        {
          title: "My Bookings",
          value: this.my_bookings.length,
          icon: "bi-calendar-check"
        },
        {
          title: "Completed Treks",
          value: this.completed_count,
          icon: "bi-flag-fill"
        }
      ];
    }
  },

  methods: {
    async loadDashboard() {
      try {
        const response = await fetch("/api/user/dashboard", {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.available_treks = result.data.available_treks || [];
          this.my_bookings = result.data.recent_bookings || [];
          this.completed_count = result.data.completed_count || 0;

          if (result.data.user_name) {
            this.userName = result.data.user_name;
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
    },

    async bookTrek(trekId) {
      try {
        const response = await fetch(`/api/user/treks/${trekId}/book`, {
          method: "POST",
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          alert("Trek booked successfully");
          this.loadDashboard();
        } else {
          alert(result.message || "Booking failed");
        }
      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    }
  },

  mounted() {
    this.loadDashboard();
  },

  template: `
    <user-layout
      active-page="dashboard"
      :user-name="userName"
      @navigate="navigate"
      @logout="logout"
    >

      <stats-cards-component
        :cards="statsData"
      ></stats-cards-component>

      <!-- Available Treks -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">Available Treks</h4>

        <button
          class="btn btn-primary btn-sm"
          @click="navigate('user-treks')"
        >
          Browse All
        </button>
      </div>

      <table-component
        :headers="['Trek Name','Location','Difficulty','Duration','Available Slots','Action']"
        :keys="['name','location','difficulty','duration','slots','actions']"
        :data="available_treks"
      >

        <template #actions="{ item }">

          <button
            class="btn btn-primary btn-sm"
            @click="bookTrek(item.raw_id)"
          >
            Book Now
          </button>

        </template>

      </table-component>

      <div class="my-5"></div>

      <!-- Recent Bookings -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">My Recent Bookings</h4>

        <button
          class="btn btn-outline-primary btn-sm"
          @click="navigate('user-bookings')"
        >
          View All
        </button>
      </div>

      <table-component
        :headers="['Trek Name','Booking Date','Status','Action']"
        :keys="['trek_name','booking_date','status','actions']"
        :data="my_bookings"
      >

        <template #actions="{ item }">

          <button
            class="btn btn-outline-secondary btn-sm"
            @click="navigate('user-bookings')"
          >
            View
          </button>

        </template>

      </table-component>

    </user-layout>
  `
};

window.UserDashboard = UserDashboard;