package io.irontest.models.assertion;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import io.irontest.models.Properties;
import io.irontest.resources.ResourceJsonViews;

public class Assertion {
    public static final String TYPE_STATUS_CODE_EQUAL = "StatusCodeEqual";
    public static final String TYPE_CONTAINS = "Contains";
    public static final String TYPE_XPATH = "XPath";
    public static final String TYPE_INTEGER_EQUAL = "IntegerEqual";
    public static final String TYPE_XML_EQUAL = "XMLEqual";
    public static final String TYPE_JSON_EQUAL = "JSONEqual";
    public static final String TYPE_JSONPATH = "JSONPath";
    public static final String TYPE_JSONPATH_XMLEQUAL = "JSONPathXMLEqual";
    public static final String TYPE_HTTP_STUB_HIT = "HTTPStubHit";
    public static final String TYPE_ALL_HTTP_STUB_REQUESTS_MATCHED = "AllHTTPStubRequestsMatched";
    private Long id;    //  id being null means this is dynamically created assertion object (no record in the Assertion database table).
    private Long teststepId;
    @JsonView(ResourceJsonViews.TestcaseExport.class)
    private String name;
    @JsonView(ResourceJsonViews.TestcaseExport.class)
    private String type;
    @JsonView(ResourceJsonViews.TestcaseExport.class)
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXTERNAL_PROPERTY, property = "type",
            defaultImpl = Properties.class)
    @JsonSubTypes({
            @JsonSubTypes.Type(value = StatusCodeEqualAssertionProperties.class, name = Assertion.TYPE_STATUS_CODE_EQUAL),
            @JsonSubTypes.Type(value = ContainsAssertionProperties.class, name = Assertion.TYPE_CONTAINS),
            @JsonSubTypes.Type(value = XPathAssertionProperties.class, name = Assertion.TYPE_XPATH),
            @JsonSubTypes.Type(value = IntegerEqualAssertionProperties.class, name = Assertion.TYPE_INTEGER_EQUAL),
            @JsonSubTypes.Type(value = XMLEqualAssertionProperties.class, name = Assertion.TYPE_XML_EQUAL),
            @JsonSubTypes.Type(value = JSONEqualAssertionProperties.class, name = Assertion.TYPE_JSON_EQUAL),
            @JsonSubTypes.Type(value = JSONPathAssertionProperties.class, name = Assertion.TYPE_JSONPATH),
            @JsonSubTypes.Type(value = JSONPathXMLEqualAssertionProperties.class, name = Assertion.TYPE_JSONPATH_XMLEQUAL),
            @JsonSubTypes.Type(value = HTTPStubHitAssertionProperties.class, name = Assertion.TYPE_HTTP_STUB_HIT)})
    private Properties otherProperties = new Properties();

    public Assertion() {}

    public Assertion(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTeststepId() {
        return teststepId;
    }

    public void setTeststepId(Long teststepId) {
        this.teststepId = teststepId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Properties getOtherProperties() {
        return otherProperties;
    }

    public void setOtherProperties(Properties otherProperties) {
        this.otherProperties = otherProperties;
    }
}
