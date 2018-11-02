<template>
  <div class="doors">
    <header class="ui three column grid middle aligned">
      <div id="signout" class="column" v-on:click=signout>
        <i class="large sign out icon"></i>
      </div>
      <div class="column">
        <img class="ui mini centered image" src="static/not_kisi_logo_256.png" />
      </div>
    </header>
    <div class="ui message error center" v-bind:class="{ hidden: !status.error }">
      <p>An error has occured. Please check your network connection and try again.</p>
      <button class="ui button" v-on:click="reload">Retry</button>
    </div>
    <div class="ui loader" v-bind:class="{ active: status.loading }"></div>
    <div class="ui middle aligned list">
      <div class="item door" v-for="door in doors" v-bind:key=door.id>
        <div class="right floated content">
          <button class="ui icon button"
                v-on:click="unlock(door.id)"
                v-bind:class="{ loading: door.unlocking }"
                v-bind:disabled=door.unlocked>
            <i class="large icon"
                v-bind:class="{ lock: !door.unlocked, unlock: door.unlocked }"></i>
          </button>
        </div>
        <div class="content">
          <i class="star large icon"
              v-bind:class="{ empty: favorites.indexOf(door.id) < 0 }"
              v-on:click="favorite(door.id)"></i>
          {{door.name}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Doors',
  data() {
    return {
      unsortedDoors: undefined,
      favorites: this.retrieveFavorites(),
      status: {
        error: false,
        loading: false,
      },
    };
  },
  computed: {
    doors() {
      const doors = this.unsortedDoors;
      const favorites = this.favorites;
      if (!doors || !favorites) {
        return [];
      }

      return doors.slice().sort((left, right) => {
        const leftIsFavorited = favorites.indexOf(left.id) >= 0;
        const rightIsFavorited = favorites.indexOf(right.id) >= 0;

        if (leftIsFavorited && !rightIsFavorited) return -1;
        if (rightIsFavorited && !leftIsFavorited) return 1;

        if (right.name < left.name) return 1;
        if (left.name < right.name) return -1;

        return 0;
      });
    },
  },
  mounted() {
    const intervalId = setInterval(() => {
      fetch('https://api.kisi.io/user', {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Login-Secret': this.retrieveSecret(),
        },
      })
        .then((response) => {
          if (!response.ok) {
            clearInterval(intervalId);
            if (response.status === 401) {
              localStorage.removeItem('notkisi_user');
              localStorage.removeItem('notkisi_auth');
              this.$router.push('/');
            }
            return;
          }

          response.text()
            .then((auth) => {
              this.status.error = false;
              localStorage.setItem('notkisi_user', auth);
            })
            .catch(() => {
              this.status.error = true;
              clearInterval(intervalId);
            });
        })
        .catch(() => {
          this.status.error = true;
          clearInterval(intervalId);
        });
    }, 5 * 1000);

    this.status.loading = true;
    fetch('https://api.kisi.io/locks/?place_id=5478&limit=100', {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Login-Secret': this.retrieveSecret(),
      },
    })
      .then((response) => {
        if (!response.ok) {
          this.status.error = true;
          return;
        }

        this.status.error = false;
        response.json()
          .then((doors) => {
            doors.forEach((door) => {
              // eslint-disable-next-line no-param-reassign
              door.unlocking = false;
            });
            this.status.error = false;
            this.status.loading = false;
            this.unsortedDoors = doors;
          })
          .catch(() => {
            this.status.error = true;
            this.status.loading = false;
          });
      })
      .catch(() => {
        this.status.error = true;
        this.status.loading = false;
      });
  },
  methods: {
    signout() {
      this.$router.push('/logout');
    },
    favorite(id) {
      const favorites = this.retrieveFavorites();
      const index = favorites.indexOf(id);
      if (index < 0) {
        favorites.push(id);
      } else {
        favorites.splice(index, 1);
      }
      localStorage.setItem('notkisi_favorites', JSON.stringify(favorites));
      this.favorites = favorites;
    },
    unlock(id) {
      const door = this.doors.find(d => id === d.id);
      if (!door) {
        return;
      }

      door.unlocking = true;
      fetch(`https://api.kisi.io/locks/${id}/unlock`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Login-Secret': this.retrieveSecret(),
        },
        body: '{}',
      })
        .then((response) => {
          door.unlocking = false;
          if (!response.ok) {
            this.status.error = true;
            return;
          }

          this.status.error = false;
          door.unlocked = true;
          setTimeout(() => {
            door.unlocked = false;
          }, 5 * 1000);
        })
        .catch(() => {
          this.status.error = true;
          door.unlocking = false;
        });
    },
    reload() {
      window.location.reload();
    },
    retrieveFavorites() {
      const favorites = localStorage.getItem('notkisi_favorites');
      if (!favorites) {
        return [];
      }

      return JSON.parse(favorites);
    },
    retrieveSecret() {
      const rawAuthn = localStorage.getItem('notkisi_auth');
      if (!rawAuthn) {
        this.$router.push('/logout');
        return undefined;
      }

      const authn = JSON.parse(rawAuthn);
      return authn.secret;
    },
  },
};
</script>

<style scoped>
.doors > header {
  padding-bottom: 10px;
}

.door > .content {
  height: 40px;
  display: table-cell;
}
</style>
