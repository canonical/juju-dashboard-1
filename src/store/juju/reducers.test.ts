import { DeltaChangeTypes, DeltaEntityTypes } from "juju/types";
import {
  charmInfoFactory,
  charmApplicationFactory,
} from "testing/factories/juju/Charms";
import { fullStatusFactory } from "testing/factories/juju/ClientV6";
import {
  controllerFactory,
  jujuStateFactory,
  modelDataFactory,
  modelListInfoFactory,
} from "testing/factories/juju/juju";
import {
  modelWatcherModelDataFactory,
  modelWatcherModelInfoFactory,
} from "testing/factories/juju/model-watcher";

import { actions, reducer } from "./slice";

const status = fullStatusFactory.build({
  model: {
    "available-version": "",
    "cloud-tag": "",
    "meter-status": {
      color: "",
      message: "",
    },
    "model-status": {
      data: {},
      info: "",
      kind: "",
      life: "",
      since: "",
      status: "",
      version: "",
    },
    name: "",
    sla: "",
    type: "",
    version: "",
    region: "west",
  },
});

const model = modelDataFactory.build({
  uuid: "abc123",
  applications: status.applications,
  machines: status.machines,
  model: status.model,
  offers: status.offers,
  relations: status.relations,
  "remote-applications": status["remote-applications"],
});

describe("reducers", () => {
  it("default", () => {
    expect(reducer(undefined, { type: "" })).toStrictEqual(
      jujuStateFactory.build()
    );
  });

  it("updateModelList", () => {
    const state = jujuStateFactory.build({ modelsLoaded: false });
    expect(
      reducer(
        state,
        actions.updateModelList({
          models: {
            "user-models": [
              {
                model: {
                  uuid: "abc123",
                  name: "a model",
                  "owner-tag": "user-eggman@external",
                  type: "model",
                },
                "last-connection": "today",
              },
            ],
          },
          wsControllerURL: "wss://example.com",
        })
      )
    ).toStrictEqual({
      ...state,
      models: {
        abc123: modelListInfoFactory.build({
          uuid: "abc123",
          name: "a model",
          ownerTag: "user-eggman@external",
          type: "model",
          wsControllerURL: "wss://example.com",
        }),
      },
      modelsLoaded: true,
    });
  });

  it("updateModelStatus", () => {
    const updatedModel = {
      ...model,
      uuid: "abc123",
    };
    delete updatedModel.info;
    const state = jujuStateFactory.build();
    expect(
      reducer(
        state,
        actions.updateModelStatus({
          modelUUID: "abc123",
          status,
          wsControllerURL: "wss://example.com",
        })
      )
    ).toStrictEqual({
      ...state,
      modelData: {
        abc123: updatedModel,
      },
    });
  });

  it("updateModelInfo", () => {
    const state = jujuStateFactory.build({
      modelData: {
        abc123: model,
      },
    });
    const modelInfo = {
      results: [
        {
          error: {
            code: "",
            message: "",
          },
          result: {
            "agent-version": "5",
            "controller-uuid": "controller1",
            "cloud-region": "west",
            machines: [],
            "owner-tag": "user-eggman@external",
            users: [],
            uuid: "abc123",
            "cloud-tag": "cloud-aws",
            region: "us-east-1",
            type: "iaas",
            version: "2.9.12",
            "model-uuid": "abc123",
            name: "enterprise",
            life: "alive",
            owner: "kirk@external",
            "is-controller": false,
            constraints: {},
            config: {
              "default-series": "bionic",
            },
            sla: {
              level: "unsupported",
              owner: "",
            },
          },
        },
      ],
    };
    expect(
      reducer(
        state,
        actions.updateModelInfo({
          modelInfo,
          wsControllerURL: "wss://example.com",
        })
      )
    ).toStrictEqual({
      ...state,
      modelData: {
        abc123: {
          ...model,
          info: modelInfo.results[0].result,
        },
      },
    });
  });

  it("clearModelData", () => {
    const state = jujuStateFactory.build({
      modelData: {
        abc123: model,
      },
      models: {
        abc123: modelListInfoFactory.build(),
      },
      modelsLoaded: true,
    });
    expect(reducer(state, actions.clearModelData())).toStrictEqual(
      jujuStateFactory.build({ modelsLoaded: false })
    );
  });

  it("clearControllerData", () => {
    const state = jujuStateFactory.build({
      controllers: {
        "wss://example.com": [controllerFactory.build()],
      },
    });
    expect(reducer(state, actions.clearControllerData())).toStrictEqual({
      ...state,
      controllers: {},
    });
  });

  it("updateControllerList", () => {
    const state = jujuStateFactory.build();
    const controllers = [controllerFactory.build()];
    expect(
      reducer(
        state,
        actions.updateControllerList({
          controllers,
          wsControllerURL: "wss://example.com",
        })
      )
    ).toStrictEqual({
      ...state,
      controllers: {
        "wss://example.com": controllers,
      },
    });
  });

  it("populateMissingAllWatcherData", () => {
    const state = jujuStateFactory.build({
      modelWatcherData: { abc123: modelWatcherModelDataFactory.build() },
    });
    expect(
      reducer(
        state,
        actions.populateMissingAllWatcherData({
          status,
          uuid: "abc123",
        })
      )
    ).toStrictEqual({
      ...state,
      modelWatcherData: {
        abc123: modelWatcherModelDataFactory.build({
          ...state.modelWatcherData?.abc123,
          model: modelWatcherModelInfoFactory.build({
            ...state.modelWatcherData?.abc123.model,
            "cloud-tag": status.model["cloud-tag"],
            type: status.model.type,
            region: status.model.region,
            version: status.model.version,
          }),
        }),
      },
    });
  });

  it("processAllWatcherDeltas", () => {
    const state = jujuStateFactory.build({
      modelWatcherData: {
        abc123: modelWatcherModelDataFactory.build({
          annotations: {
            "ceph-mon": {
              "gui-x": "818",
              "gui-y": "563",
            },
          },
        }),
      },
    });
    expect(state.modelWatcherData?.abc123.annotations).toStrictEqual({
      "ceph-mon": {
        "gui-x": "818",
        "gui-y": "563",
      },
    });
    const reducedState = reducer(
      state,
      actions.processAllWatcherDeltas([
        [
          DeltaEntityTypes.ANNOTATION,
          DeltaChangeTypes.CHANGE,
          {
            "model-uuid": "abc123",
            tag: "application-etcd",
            annotations: { new: "changed" },
          },
        ],
      ])
    );
    expect(reducedState.modelWatcherData?.abc123.annotations).toStrictEqual({
      etcd: {
        new: "changed",
      },
      "ceph-mon": {
        "gui-x": "818",
        "gui-y": "563",
      },
    });
  });

  it("updateCharms", () => {
    const state = jujuStateFactory.build({
      charms: [
        charmInfoFactory.build({ url: "ch:mysql" }),
        charmInfoFactory.build({ url: "ch:ceph" }),
      ],
    });
    const charms = [
      charmInfoFactory.build({ url: "ch:postgres" }),
      charmInfoFactory.build({ url: "ch:ceph" }),
    ];
    expect(
      reducer(
        state,
        actions.updateCharms({
          charms,
          wsControllerURL: "wss://test.example.com",
        })
      )
    ).toStrictEqual({
      ...state,
      charms: [
        charmInfoFactory.build({ url: "ch:mysql" }),
        charmInfoFactory.build({ url: "ch:ceph" }),
        charmInfoFactory.build({ url: "ch:postgres" }),
      ],
    });
  });

  it("updateSelectedApplications", () => {
    const state = jujuStateFactory.build({
      selectedApplications: [
        charmApplicationFactory.build({ "charm-url": "ch:mysql" }),
      ],
    });
    const selectedApplications = [
      charmApplicationFactory.build({ "charm-url": "ch:ceph" }),
    ];
    expect(
      reducer(
        state,
        actions.updateSelectedApplications({
          selectedApplications,
        })
      )
    ).toStrictEqual({
      ...state,
      selectedApplications,
    });
  });
});
