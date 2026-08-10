const StaffParticipants = {
  components: {
    StaffLayout: window.StaffLayout,
    TableComponent: window.TableComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      staffName: "Staff Member",

      participants: [],
      trekList: [],

      searchQuery: "",
      statusFilter: "All",
      trekFilter: "All"
    };
  },

  methods: {
    async loadParticipants() {
      try {
        const params = new URLSearchParams({
          search: this.searchQuery,
          status: this.statusFilter,
          trek: this.trekFilter
        });

        const response = await fetch(`/api/staff/participants?${params.toString()}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.participants = result.data.participants || [];
          this.trekList = result.data.treks || [];

          this.searchQuery = result.data.filters?.search || this.searchQuery;
          this.statusFilter = result.data.filters?.status || this.statusFilter;
          this.trekFilter = result.data.filters?.trek || this.trekFilter;
        } else {
          alert(result.message || "Failed to load participants");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    applyFilters() {
      this.loadParticipants();
    },

    navigate(page) {
      this.$emit("navigate", page);
    },

    async logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } finally {
        this.$emit("logout");
      }
    }
  },

  mounted() {
    this.loadParticipants();
  },

  template: `
    <staff-layout
      active-page="participants"
      :staff-name="staffName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">Registered Participants</h2>

      <div class="row mb-4">

        <div class="col-md-5 mb-3">

          <div class="input-group">

            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>

            <input
              type="text"
              class="form-control"
              placeholder="Search by participant or trek..."
              v-model="searchQuery"
              @keyup.enter="applyFilters"
            >

          </div>

        </div>

        <div class="col-md-3 mb-3">

          <select
            class="form-select"
            v-model="statusFilter"
            @change="applyFilters"
          >

            <option value="All">Status: All</option>
            <option value="Booked">Booked</option>
            <option value="Cancelled">Cancelled</option>

          </select>

        </div>

        <div class="col-md-4 mb-3">

          <select
            class="form-select"
            v-model="trekFilter"
            @change="applyFilters"
          >

            <option value="All">All Treks</option>

            <option
              v-for="trek in trekList"
              :key="trek.trekid"
              :value="String(trek.trekid)"
            >
              {{ trek.trekname }}
            </option>

          </select>

        </div>

      </div>

      <table-component
        :headers="['User Name', 'Email', 'Phone', 'Assigned Trek', 'Booking Date', 'Status']"
        :keys="['user_name', 'email', 'phone', 'trek_title', 'booking_date', 'status']"
        :data="participants"
      ></table-component>

    </staff-layout>
  `
};

window.StaffParticipants = StaffParticipants;