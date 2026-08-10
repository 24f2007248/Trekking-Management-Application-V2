const StaffManageTrek = {
  components: {
    StaffLayout: window.StaffLayout,
    TableComponent: window.TableComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      staffName: "Staff Member",
      trekId: null,
      trek: {
        trekname: "",
        location: "",
        duration: 0,
        start_date: "",
        end_date: "",
        total_slots: 0,
        available_slots: 0,
        status: "Open"
      },
      participants: []
    };
  },

  methods: {
    async loadTrek() {
      try {
        const response = await fetch(`/api/staff/treks/${this.trekId}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.trek = result.data.trek;
          this.participants = result.data.participants || [];

          if (result.data.staff_name) {
            this.staffName = result.data.staff_name;
          }
        } else {
          alert(result.message || "Failed to load trek");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    async updateSettings() {
      try {
        const response = await fetch(`/api/staff/treks/${this.trekId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            available_slots: this.trek.available_slots,
            status: this.trek.status
          })
        });

        const result = await response.json();

        if (result.success) {
          alert("Trek settings updated");
          this.loadTrek();
        } else {
          alert(result.message || "Failed to update settings");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    async changeStatus(nextState) {
      try {
        const response = await fetch(`/api/staff/treks/${this.trekId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            status: nextState
          })
        });

        const result = await response.json();

        if (result.success) {
          this.loadTrek();
        } else {
          alert(result.message || "Status update failed");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
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
    this.trekId = this.$root.selectedTrekId;

    if (this.trekId) {
      this.loadTrek();
    }
  },

  template: `
    <staff-layout
      active-page="treks"
      :staff-name="staffName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">Manage Trek - {{ trek.trekname }}</h2>

      <div class="card shadow-sm mb-5">

        <div class="card-body">

          <h4 class="mb-4">Trek Information</h4>

          <form @submit.prevent="updateSettings">

            <div class="row">

              <div class="col-md-6">

                <p><strong>Location:</strong> {{ trek.location }}</p>
                <p><strong>Duration:</strong> {{ trek.duration }} Days</p>
                <p><strong>Start Date:</strong> {{ trek.start_date }}</p>
                <p><strong>End Date:</strong> {{ trek.end_date }}</p>

              </div>

              <div class="col-md-6">

                <div class="mb-3">

                  <label class="form-label">
                    Available Slots
                  </label>

                  <input
                    type="number"
                    class="form-control"
                    v-model.number="trek.available_slots"
                    min="0"
                    :max="trek.total_slots"
                  >

                </div>

                <div class="mb-3">

                  <label class="form-label">
                    Status
                  </label>

                  <select
                    class="form-select"
                    v-model="trek.status"
                  >

                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Started">Started</option>
                    <option value="Completed">Completed</option>

                  </select>

                </div>

                <button
                  class="btn btn-dark"
                  type="submit"
                >
                  Update Settings
                </button>

              </div>

            </div>

          </form>

        </div>

      </div>

      <div class="card shadow-sm mb-5">

        <div class="card-body">

          <h4 class="mb-3">
            Participants ({{ participants.length }})
          </h4>

          <table-component
            :headers="['User Name', 'Email', 'Booking Date', 'Status']"
            :keys="['user_name', 'email', 'booking_date', 'status']"
            :data="participants"
          ></table-component>

        </div>

      </div>

      <div class="d-flex gap-3">

        <button
          class="btn btn-outline-primary"
          :disabled="['Started','Completed'].includes(trek.status)"
          @click="changeStatus('Started')"
        >
          Mark as Started
        </button>

        <button
          class="btn btn-outline-success"
          :disabled="trek.status !== 'Started'"
          @click="changeStatus('Completed')"
        >
          Mark as Completed
        </button>

      </div>

    </staff-layout>
  `
};

window.StaffManageTrek = StaffManageTrek;