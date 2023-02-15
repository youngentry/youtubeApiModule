/////////////////////////////////////////////////////
////////// Youtube Api Search 검색 결과 예시 /////////
// https://developers.google.com/youtube/v3/docs/search/list?hl=ko&apix=true&apix_params=%7B%22part%22%3A%5B%22snippet%22%5D%2C%22maxResults%22%3A1%2C%22order%22%3A%22date%22%2C%22q%22%3A%22%EC%9C%A4%EC%84%B1%EB%B9%88%22%2C%22regionCode%22%3A%22kr%22%2C%22type%22%3A%5B%22video%22%5D%7D#%EC%A7%81%EC%A0%91-%EC%82%AC%EC%9A%A9%ED%95%B4-%EB%B3%B4%EC%84%B8%EC%9A%94
/////////////////////////////////////////////////////
const mockData = {
  kind: "youtube#searchListResponse",
  etag: "ciheMR_7QpXBNB8tZTdUzyCkgWU",
  nextPageToken: "CAEQAA",
  regionCode: "KR",
  pageInfo: {
    totalResults: 59222,
    resultsPerPage: 1,
  },
  items: [
    {
      kind: "youtube#searchResult",
      etag: "XXwWuueS3xjy9z0vV7g_yJkkQt0",
      id: {
        kind: "youtube#video",
        videoId: "eH3AJdFoYqM",
      },
      snippet: {
        publishedAt: "2023-02-15T12:45:04Z",
        channelId: "UCbdMhyYgP9WbL6By5V-oV8A",
        title: "100kg 돌굴리기 최후의 2인 윤성빈 정해민 시지프스의 형벌 #피지컬100",
        description: "",
        thumbnails: {
          default: {
            url: "https://i.ytimg.com/vi/eH3AJdFoYqM/default.jpg",
            width: 120,
            height: 90,
          },
          medium: {
            url: "https://i.ytimg.com/vi/eH3AJdFoYqM/mqdefault.jpg",
            width: 320,
            height: 180,
          },
          high: {
            url: "https://i.ytimg.com/vi/eH3AJdFoYqM/hqdefault.jpg",
            width: 480,
            height: 360,
          },
        },
        channelTitle: "짤뷰",
        liveBroadcastContent: "none",
        publishTime: "2023-02-15T12:45:04Z",
      },
    },
  ],
};

/////////////////////////////////////
////////// 한국 시간으로 변환 ////////
/////////////////////////////////////
/**
 * 유튜브 업로드 시간(publishedAt)과 한국 시간에 차이 없앰
 * @param {*} datePST
 * @returns
 */
export const utcToKor = (datePST) => {
  const parsedDatePST = Date.parse(datePST);
  const krUtcTimeDifference = 1 * 60 * 60 * 1000;
  const krTime = new Date(parsedDatePST + krUtcTimeDifference);
  return krTime;
};

//////////////////////////////////////
////////////// 기능 클래스 ////////////
//////////////////////////////////////
export class SearchVideo {
  #videoArray;

  constructor(searchResultData) {
    this.originSearchVideoData = searchResultData;
    this.searchVideoDataArray = [...this.originSearchVideoData.items];
    this.videoIdArray = []; // 중복된 비디오 탐색할 때 효율성 높이기 위함
    this.#videoArray = [];
  }

  getOriginSearchData() {
    return this.originSearchVideoData;
  }

  getSearchVideoDataArray() {
    return this.searchVideoDataArray;
  }

  /**
   * datePST 데이터를 입력받아 (20230101) 형태의 string 반환
   * @param {datePST} datePST
   * @returns {string} ex) '20230101'
   */
  getDatePSTAsYYYYMMDD(datePST) {
    const krTime = utcToKor(datePST);
    const year = krTime.getFullYear();
    const month = String(krTime.getMonth() + 1).padStart(2, "0");
    const day = String(krTime.getDate()).padStart(2, "0");
    const date = `${year}${month}${day}`;
    return date;
  }

  /**
   * 동영상 업로드 날짜를 담은 배열에 새로운 날짜를 추가
   * @param {Array} videoArray
   */
  pushNewDate(videoArray) {
    if (this.#videoArray.length !== videoArray.length) {
      this.#videoArray.push(videoArray[videoArray.length - 1]);
    }
  }

  /**
   * 정렬된 날짜 배열 반환 ex) [["230101"],["230102"]]
   */
  sortDateArrayByDate() {
    return this.#videoArray.sort((a, b) => parseInt(a) - parseInt(b));
  }

  getDateArray() {
    return this.#videoArray;
  }

  insertVideoDataIntoDateArray(YYYYMMDD, videoData) {
    const {
      id: { videoId },
      snippet: {
        channelId,
        channelTitle,
        publishedAt,
        title,
        description,
        thumbnails: {
          medium: { url },
        },
      },
    } = videoData;

    this.#videoArray.forEach((date, index) => {
      const sameDate = YYYYMMDD === date[0];
      if (sameDate) {
        this.#videoArray[index][1].push({
          videoId,
          channelId,
          channelTitle,
          publishedAt,
          title,
          description,
          thumbnailUrl: url,
        });
      }
    });
  }

  /**
   * this.videoIdArray에 새 videoId 요소 추가
   * @param {*} videoId
   */
  pushVideoId(videoId) {
    this.videoIdArray.push(videoId);
  }

  /**
   * this.videoIdArray에 담긴 배열에 입력받은 videoId가 없으면 새 videoId 요소 추가
   * @param {*} videoId
   * @returns
   */
  isDuplicatedVideoId(videoId) {
    const isDuplicatedVideoId = this.videoIdArray.includes(videoId);
    if (isDuplicatedVideoId) {
      return true;
    }
  }

  getVideoIdArray() {
    return this.videoIdArray;
  }
}

/////////////////////////////////////
////////////// 실행 함수 ////////////
////////////////////////////////////
export const createSearchVideoInformation = (searchResult1, ...otherSearchResults) => {
  const searchVideo = new SearchVideo(searchResult1);
  const searchVideoDataArray = searchVideo.getSearchVideoDataArray();

  // 검색 결과가 둘 이상일 경우 배열에 포함시키기
  for (const otherSearchResult of otherSearchResults) {
    if (otherSearchResult) {
      const otherSearchVideo = new SearchVideo(otherSearchResult);
      searchVideoDataArray.push(...otherSearchVideo.getSearchVideoDataArray());
    }
  }

  // 중복되는 날짜를 제거하기 위함
  const dateSet = new Set();

  for (const videoData of searchVideoDataArray) {
    // Set 객체에 "YYYYMMDD" 형태의 날짜 저장
    const YYYYMMDD = searchVideo.getDatePSTAsYYYYMMDD(videoData.snippet.publishedAt);
    dateSet.add(YYYYMMDD);

    // Set객체를 [["YYYYMMDD",[]],["YYYYMMDD"],[]] 형태의 배열로 만듦
    const dateArray = Array.from(dateSet).map((date) => [date, []]);
    searchVideo.pushNewDate(dateArray);
    searchVideo.sortDateArrayByDate();

    const videoId = videoData.id.videoId;
    // videoId 중복검사
    if (!searchVideo.isDuplicatedVideoId(videoId)) {
      // ["YYYYMMDD",[]] 비디오를 비디오 발행 일자와 일치하는 날짜 배열에 추가
      searchVideo.pushVideoId(videoId);
      searchVideo.insertVideoDataIntoDateArray(YYYYMMDD, videoData);
    }
  }

  const videoInformation = searchVideo.getDateArray();

  console.log(videoInformation);
  return videoInformation;
};

createSearchVideoInformation(mockData);
