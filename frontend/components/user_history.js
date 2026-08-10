const UserHistory = {
  components: {
    UserLayout,
    TableComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      history: [],
      currentPage: 1,
      totalPages: 1,
      searchQuery: ""
    };
  },

  async mounted() {
    await this.loadHistory();
  },

  methods: {
    async loadHistory(page = 1) {
      try {
        const response = await fetch(
          `/api/user/bookings?history=true&page=${page}&search=${encodeURIComponent(this.searchQuery)}`,
          { credentials: "include" }
        );

        const result = await response.json();

        if (result.success) {
          this.history = result.data.bookings || [];
          this.currentPage = result.data.pagination?.page || 1;
          this.totalPages = result.data.pagination?.total_pages || 1;
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Unable to connect to server");
      }
    },

    searchBookings() {
      this.loadHistory(1);
    }
  },

  template: `
    <UserLayout
      active-page="history"
      @navigate="$emit('navigate', $event)"
      @logout="$emit('logout')"
    >
      <h2 class="mb-4">Booking History</h2>

      <div class="row mb-3">
        <div class="col-md-12">
          <div class="input-group">
            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchQuery"
              @keyup.enter="searchBookings"
              type="text"
              class="form-control"
              placeholder="Search by trek name or location..."
            >
            <button class="btn btn-primary" @click="searchBookings">
              Search
            </button>
          </div>
        </div>
      </div>

      <TableComponent
        :headers="['Trek Name','Location','Booking Date','Trek Status','Booking Status']"
        :keys="['trek_name','location','booking_date','trek_status','booking_status']"
        :data="history"
      />

      <nav v-if="totalPages > 1" class="mt-4">
        <ul class="pagination justify-content-end">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a href="#" class="page-link" @click.prevent="loadHistory(currentPage - 1)">
              <i class="bi bi-chevron-left"></i>
            </a>
          </li>

          <li
            v-for="p in totalPages"
            :key="p"
            class="page-item"
            :class="{ active: p === currentPage }"
          >
            <a href="#" class="page-link" @click.prevent="loadHistory(p)">
              {{ p }}
            </a>
          </li>

          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a href="#" class="page-link" @click.prevent="loadHistory(currentPage + 1)">
              <i class="bi bi-chevron-right"></i>
            </a>
          </li>
        </ul>
      </nav>
    </UserLayout>
  `
};

window.UserHistory = UserHistory;