package io.irontest.models;

import com.fasterxml.jackson.annotation.JsonView;
import com.github.tomakehurst.wiremock.stubbing.StubMapping;
import io.irontest.resources.ResourceJsonViews;

@JsonView({ResourceJsonViews.HTTPStubUIGrid.class})
public class HTTPStubMapping {
    private long id;
    private long testcaseId;
    private short number;
    private StubMapping spec;
    private String requestBodyMainPatternValue;     //  this is to enable using Iron Test properties in request body patterns like equalToXml and equalToJson.
    private short expectedHitCount;

    public HTTPStubMapping() {}

    public HTTPStubMapping(long id, long testcaseId, short number, StubMapping spec, String requestBodyMainPatternValue, short expectedHitCount) {
        this.id = id;
        this.testcaseId = testcaseId;
        this.number = number;
        setSpec(spec);
        this.requestBodyMainPatternValue = requestBodyMainPatternValue;
        this.expectedHitCount = expectedHitCount;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public long getTestcaseId() {
        return testcaseId;
    }

    public void setTestcaseId(long testcaseId) {
        this.testcaseId = testcaseId;
    }

    public short getNumber() {
        return number;
    }

    public void setNumber(short number) {
        this.number = number;
    }

    public StubMapping getSpec() {
        return spec;
    }

    public void setSpec(StubMapping spec) {
        this.spec = spec;
        this.spec.setId(null);    //  UUID is for stub instance, not for stub spec/definition.
    }

    public String getRequestBodyMainPatternValue() {
        return requestBodyMainPatternValue;
    }

    public void setRequestBodyMainPatternValue(String requestBodyMainPatternValue) {
        this.requestBodyMainPatternValue = requestBodyMainPatternValue;
    }

    public short getExpectedHitCount() {
        return expectedHitCount;
    }

    public void setExpectedHitCount(short expectedHitCount) {
        this.expectedHitCount = expectedHitCount;
    }
}
