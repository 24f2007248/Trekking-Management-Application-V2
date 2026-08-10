const UserTrekDetails = {
  components: {
    UserLayout: window.UserLayout
  },

  data() {
    return {
      userName: "User Member",
      trekId: null,

      trek: {
        trekname: "",
        location: "",
        difficulty: "",
        duration: 0,
        description: "",
        start_date: "",
        end_date: "",
        total_slots: 0,
        available_slots: 0,
        status: ""
      },

      booking: {
        booking_date: "",
        booking_status: ""
      }
    };
  },

  methods: {
    async loadDetails() {
      try {
        const response = await fetch(`/api/user/treks/${this.trekId}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.trek = result.data.trek;
          this.booking = result.data.booking || {};

          if (result.data.user_name) {
            this.userName = result.data.user_name;
          }
        } else {
          alert(result.message || "Failed to load trek details");
          this.navigate("user-bookings");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
        this.navigate("user-bookings");
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
        window.location.reload();
      }
    }
  },

  mounted() {
    this.trekId = this.$root.selectedTrekId;

    if (!this.trekId) {
      this.navigate("user-bookings");
      return;
    }

    this.loadDetails();
  },

  template: `
<UserLayout
  active-page="bookings"
  :user-name="userName"
  @navigate="navigate"
  @logout="logout"
>

  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0">Trek Details</h2>

    <button
      class="btn btn-secondary"
      @click="navigate('user-bookings')"
    >
      <i class="bi bi-arrow-left"></i>
      Back
    </button>
  </div>

  <div class="card shadow-sm mb-4">

    <div class="card-body">

      <h4 class="mb-3">{{ trek.trekname }}</h4>

      <div class="row">

        <div class="col-md-6">

          <p><strong>Location:</strong> {{ trek.location }}</p>

          <p><strong>Difficulty:</strong> {{ trek.difficulty }}</p>

          <p><strong>Duration:</strong> {{ trek.duration }} Days</p>

          <p><strong>Status:</strong> {{ trek.status }}</p>

        </div>

        <div class="col-md-6">

          <p><strong>Start Date:</strong> {{ trek.start_date }}</p>

          <p><strong>End Date:</strong> {{ trek.end_date }}</p>

          <p><strong>Total Slots:</strong> {{ trek.total_slots }}</p>

          <p><strong>Available Slots:</strong> {{ trek.available_slots }}</p>

        </div>

      </div>

      <hr>

      <h5>Description</h5>

      <p class="mb-0">
        {{ trek.description || "No description available." }}
      </p>

    </div>

  </div>

  <div class="card shadow-sm">

    <div class="card-body">

      <h5 class="mb-3">Your Booking</h5>

      <p><strong>Booking Date:</strong> {{ booking.booking_date }}</p>

      <p><strong>Booking Status:</strong> {{ booking.booking_status }}</p>

    </div>

  </div>

</UserLayout>
`
};

window.UserTrekDetails = UserTrekDetails;